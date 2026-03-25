import { NextRequest, NextResponse } from 'next/server';
import { logActivity, bulkInsertActivities } from '@/lib/activities-db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Accept single or array
    const items = Array.isArray(body) ? body : body.type ? [body] : body.events || body.activities || [];

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Expected activity object or array of activities' },
        { status: 400 }
      );
    }

    const validStatuses = ['success', 'error', 'pending', 'running'];

    if (items.length === 1) {
      const a = items[0];
      if (!a.type || !a.description || !a.status || !validStatuses.includes(a.status)) {
        return NextResponse.json(
          { error: 'Missing required fields: type, description, status' },
          { status: 400 }
        );
      }
      const activity = logActivity(a.type, a.description, a.status, {
        duration_ms: a.duration_ms ?? null,
        tokens_used: a.tokens_used ?? null,
        agent: a.agent ?? null,
        metadata: a.metadata ?? null,
      });
      return NextResponse.json({ ingested: 1, activities: [activity] }, { status: 201 });
    }

    const validated = items.filter(
      (a: Record<string, unknown>) =>
        a.type && a.description && a.status && validStatuses.includes(a.status as string)
    ).map((a: Record<string, unknown>) => ({
      type: a.type as string,
      description: a.description as string,
      status: a.status as string,
      timestamp: (a.timestamp as string) || new Date().toISOString(),
      agent: (a.agent as string) || null,
      metadata: (a.metadata as Record<string, unknown>) || null,
    }));

    const count = bulkInsertActivities(validated);
    return NextResponse.json({ ingested: count, skipped: items.length - count }, { status: 201 });
  } catch (error) {
    console.error('Failed to ingest activities:', error);
    return NextResponse.json({ error: 'Failed to ingest activities' }, { status: 500 });
  }
}
