export default async function globalTeardown() {
  const server = (globalThis as any).__server_process;

  if (server && !server.killed) {
    server.kill("SIGTERM");
    await new Promise((r) => setTimeout(r, 2_000));
    if (!server.killed) server.kill("SIGKILL");
  }

  console.log("hugo preview server stopped");
}
