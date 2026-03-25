export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startActivityPoller } = await import('./lib/activity-poller');
    startActivityPoller();
  }
}
