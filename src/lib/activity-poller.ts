/**
 * Activity Poller — reads OpenClaw log files and maps entries to activity events.
 * Runs on app startup and then every 5 minutes.
 */
import fs from 'fs';
import path from 'path';
import { logActivityWithTimestamp, bulkInsertActivities } from './activities-db';

const LOG_DIR = '/tmp/openclaw';
const STATE_PATH = path.join(process.cwd(), 'data', 'activity-poller-state.json');
const POLL_INTERVAL_MS = 5 * 60 * 1000;

interface PollerState {
  lastParsedTimestamp: string | null;
}

interface ParsedActivity {
  type: string;
  description: string;
  status: string;
  timestamp: string;
  agent?: string;
  metadata?: Record<string, unknown>;
}

function getState(): PollerState {
  try {
    if (fs.existsSync(STATE_PATH)) {
      return JSON.parse(fs.readFileSync(STATE_PATH, 'utf-8'));
    }
  } catch {}
  return { lastParsedTimestamp: null };
}

function saveState(state: PollerState) {
  try {
    fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
  } catch (e) {
    console.error('[activity-poller] Failed to save state:', e);
  }
}

function getTodayLogPath(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return path.join(LOG_DIR, `openclaw-${yyyy}-${mm}-${dd}.log`);
}

interface LogEntry {
  '0'?: string;
  '1'?: string | Record<string, unknown>;
  '2'?: string;
  _meta?: {
    date?: string;
    logLevelName?: string;
    name?: string;
  };
  time?: string;
}

function parseLogLine(entry: LogEntry): ParsedActivity | null {
  const subsystemRaw = entry['0'] || '';
  const msg1 = entry['1'];
  const msg2 = entry['2'] || '';
  const timestamp = entry._meta?.date || entry.time || new Date().toISOString();

  // Extract subsystem name
  let subsystem = '';
  try {
    const parsed = JSON.parse(subsystemRaw);
    subsystem = parsed.subsystem || parsed.module || '';
  } catch {
    subsystem = subsystemRaw;
  }

  const msg1Str = typeof msg1 === 'string' ? msg1 : '';

  // Telegram sendMessage ok
  if (subsystem.includes('gateway/channels/telegram') && msg1Str.includes('telegram sendMessage ok')) {
    const chatMatch = msg1Str.match(/chat=(\d+)/);
    const msgMatch = msg1Str.match(/message=(\d+)/);
    return {
      type: 'message',
      description: `Telegram message sent to ${chatMatch?.[1] || 'unknown'}`,
      status: 'success',
      timestamp,
      metadata: { channel: 'telegram', chat_id: chatMatch?.[1], message_id: msgMatch?.[1] },
    };
  }

  // Telegram sendMessage failed
  if (subsystem.includes('gateway/channels/telegram') && msg1Str.includes('telegram sendMessage failed')) {
    return {
      type: 'message',
      description: 'Telegram send failed',
      status: 'error',
      timestamp,
      metadata: { channel: 'telegram' },
    };
  }

  // Telegram message processing failed
  if (subsystem.includes('telegram') && msg1Str.includes('message processing failed')) {
    return {
      type: 'message',
      description: 'Telegram delivery failed',
      status: 'error',
      timestamp,
      metadata: { channel: 'telegram' },
    };
  }

  // Slack connected
  if (subsystem.includes('gateway/channels/slack') && msg1Str.includes('slack socket mode connected')) {
    return {
      type: 'message',
      description: 'Slack connected',
      status: 'success',
      timestamp,
      metadata: { channel: 'slack' },
    };
  }

  // Slack message sent (generic ok pattern)
  if (subsystem.includes('gateway/channels/slack') && (msg1Str.includes('ok') || msg1Str.includes('sent'))) {
    return {
      type: 'message',
      description: 'Slack message sent',
      status: 'success',
      timestamp,
      metadata: { channel: 'slack' },
    };
  }

  // Gateway config reload
  if (subsystem.includes('gateway/reload') && msg1Str.includes('config change detected')) {
    const fieldsMatch = msg1Str.match(/evaluating reload \((.+)\)/);
    return {
      type: 'task',
      description: `Config updated: ${fieldsMatch?.[1] || 'unknown fields'}`,
      status: 'success',
      timestamp,
      metadata: { subsystem: 'gateway/reload', fields: fieldsMatch?.[1] },
    };
  }

  // Gateway config restart required
  if (subsystem.includes('gateway/reload') && msg1Str.includes('config change requires gateway restart')) {
    return {
      type: 'task',
      description: `Gateway restart required: ${msg1Str}`,
      status: 'success',
      timestamp,
      metadata: { subsystem: 'gateway/reload' },
    };
  }

  // Cron started
  if (subsystem.includes('cron') && msg2.includes('cron: started')) {
    const jobData = typeof msg1 === 'object' && msg1 !== null ? msg1 : {};
    return {
      type: 'cron',
      description: `Cron scheduler started (${(jobData as Record<string, unknown>).jobs || '?'} jobs)`,
      status: 'success',
      timestamp,
      metadata: { ...(jobData as Record<string, unknown>) },
    };
  }

  // Cron error backoff
  if (subsystem.includes('cron') && msg2.includes('cron: applying error backoff')) {
    const jobData = typeof msg1 === 'object' && msg1 !== null ? msg1 : {};
    const jd = jobData as Record<string, unknown>;
    return {
      type: 'cron',
      description: `Cron job failed: ${jd.jobId || 'unknown'} (${jd.consecutiveErrors || '?'} consecutive errors)`,
      status: 'error',
      timestamp,
      metadata: { ...(jobData as Record<string, unknown>) },
    };
  }

  // Cron finished (ok)
  if (subsystem.includes('cron') && (msg2.includes('finished') || msg2.includes('completed'))) {
    const jobData = typeof msg1 === 'object' && msg1 !== null ? msg1 : {};
    const jd = jobData as Record<string, unknown>;
    const hasError = entry._meta?.logLevelName === 'ERROR' || msg2.includes('error');
    return {
      type: 'cron',
      description: hasError ? `Cron job failed: ${jd.jobId || 'unknown'}` : `Cron job completed: ${jd.jobId || 'unknown'}`,
      status: hasError ? 'error' : 'success',
      timestamp,
      metadata: { ...(jobData as Record<string, unknown>) },
    };
  }

  // iMessage failed
  if (msg1Str.includes('imsg rpc: failed') || (subsystem.includes('imsg') && msg1Str.includes('failed'))) {
    return {
      type: 'message',
      description: 'iMessage delivery failed',
      status: 'error',
      timestamp,
      metadata: { channel: 'imessage' },
    };
  }

  return null;
}

export function parseLogFile(filePath: string, afterTimestamp?: string | null): ParsedActivity[] {
  if (!fs.existsSync(filePath)) {
    console.log(`[activity-poller] Log file not found: ${filePath}`);
    return [];
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(Boolean);
  const activities: ParsedActivity[] = [];

  for (const line of lines) {
    let entry: LogEntry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }

    const entryTime = entry._meta?.date || entry.time;
    if (afterTimestamp && entryTime && entryTime <= afterTimestamp) {
      continue;
    }

    const activity = parseLogLine(entry);
    if (activity) {
      activities.push(activity);
    }
  }

  return activities;
}

function pollOnce() {
  try {
    const logPath = getTodayLogPath();
    const state = getState();
    const activities = parseLogFile(logPath, state.lastParsedTimestamp);

    if (activities.length === 0) return;

    let latestTimestamp = state.lastParsedTimestamp;
    for (const a of activities) {
      logActivityWithTimestamp(a.type, a.description, a.status, a.timestamp, {
        agent: a.agent || null,
        metadata: a.metadata || null,
      });
      if (!latestTimestamp || a.timestamp > latestTimestamp) {
        latestTimestamp = a.timestamp;
      }
    }

    saveState({ lastParsedTimestamp: latestTimestamp });
    console.log(`[activity-poller] Ingested ${activities.length} activities from ${path.basename(logPath)}`);
  } catch (e) {
    console.error('[activity-poller] Poll error:', e);
  }
}

let pollTimer: ReturnType<typeof setInterval> | null = null;

export function startActivityPoller() {
  console.log('[activity-poller] Starting...');
  pollOnce();
  if (!pollTimer) {
    pollTimer = setInterval(pollOnce, POLL_INTERVAL_MS);
  }
}

export function stopActivityPoller() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

export function seedFromLogFile(filePath: string, maxEntries = 200): number {
  console.log(`[activity-poller] Seeding from ${filePath}...`);
  const activities = parseLogFile(filePath);
  const toInsert = activities.slice(0, maxEntries);

  if (toInsert.length === 0) {
    console.log('[activity-poller] No activities to seed');
    return 0;
  }

  const count = bulkInsertActivities(toInsert);
  console.log(`[activity-poller] Seeded ${count} activities`);

  // Update state to latest timestamp
  const latest = toInsert.reduce((max, a) => a.timestamp > max ? a.timestamp : max, '');
  if (latest) {
    const state = getState();
    if (!state.lastParsedTimestamp || latest > state.lastParsedTimestamp) {
      saveState({ lastParsedTimestamp: latest });
    }
  }

  return count;
}
