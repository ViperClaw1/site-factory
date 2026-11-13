// Runs once when the Next.js server starts: fail fast on missing env (lib/env.ts).
// Next 14 only logs a throw from here and keeps serving 500s, so exit explicitly.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { assertEnv } = await import("./lib/env");
    try {
      assertEnv();
    } catch (error) {
      console.error((error as Error).message);
      process.exit(1);
    }
  }
}
