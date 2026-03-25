import { NextRequest, NextResponse } from 'next/server';
import { bulkInsertActivities } from '@/lib/activities-db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const items = Array.isArray(body) ? body : body.activities;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Expected an array of activities (or { activities: [...] })' },
        { status: 400 }
      );
    }

    const validStatuses = ['success', 'error', 'pending', 'running'];
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

    if (validated.length === 0) {
      return NextResponse.json(
        { error: 'No valid activities found. Each needs: type, description, status' },
        { status: 400 }
      );
    }

    const count = bulkInsertActivities(validated);
    return NextResponse.json({ inserted: count, total: items.length, skipped: items.length - count }, { status: 201 });
  } catch (error) {
    console.error('Failed to seed activities:', error);
    return NextResponse.json({ error: 'Failed to seed activities' }, { status: 500 });
  }
}
