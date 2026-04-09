import { spawn, type ChildProcess } from "child_process";
import { resolve } from "path";

const ROOT = resolve(__dirname, "../..");
const PORT = parseInt(process.env.PREVIEW_PORT || "8100", 10);

async function waitForReady(url: string, timeoutMs = 30_000): Promise<void> {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // not ready yet
    }

    await new Promise((r) => setTimeout(r, 500));
  }

  throw new Error(`timed out waiting for ${url}`);
}

export default async function globalSetup() {
  const serverProcess = spawn("just", ["preview", String(PORT)], {
    cwd: ROOT,
  });

  (globalThis as any).__server_process = serverProcess;
  serverProcess.stderr?.on("data", (d: Buffer) =>
    process.stderr.write(`[hugo] ${d}`)
  );

  await waitForReady(`http://127.0.0.1:${PORT}/`);
  console.log(`hugo preview ready on port ${PORT}`);
}
