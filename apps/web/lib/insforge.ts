export function getDatabaseProviderInfo() {
  const hasDb = Boolean(process.env.DATABASE_URL);
  const hasInsforge = Boolean(process.env.INSFORGE_API_KEY);
  return {
    provider: hasDb ? "insforge-postgres" : "local-memory-fallback",
    insforgeConfigured: hasInsforge,
    auth: hasInsforge ? "insforge-auth-available" : "demo-auth",
    storage: hasInsforge ? "insforge-storage-available" : "local",
    note: hasDb
      ? "InsForge provides the Postgres backend via DATABASE_URL. Auth and storage available when INSFORGE_API_KEY is set."
      : "No DATABASE_URL was provided, so the localhost demo uses an in-process database fallback."
  };
}
