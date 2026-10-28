export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { getDb } = await import('./lib/db');
    getDb();
    const { startScheduler } = await import('./lib/scheduler');
    startScheduler();
  }
}
