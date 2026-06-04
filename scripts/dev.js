#!/usr/bin/env node
// Watchdog wrapper for `next dev`.
// Polls the number of running node processes every 3 seconds.
// If the count exceeds MAX_NODE_PROCS, it kills the dev server and exits
// cleanly rather than letting hundreds of workers freeze the machine.

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { spawn, execSync } = require("child_process")
const nextBin = require.resolve("next/dist/bin/next")

const MAX_NODE_PROCS = 30 // workerThreads keeps this low; spike above 30 means something went wrong
const POLL_MS = 3000

const server = spawn(process.execPath, [nextBin, "dev", "--webpack", "--port", "3030"], {
  stdio: "inherit",
  env: { ...process.env, NODE_OPTIONS: "--max-old-space-size=4096" },
})

const watchdog = setInterval(() => {
  try {
    const count = parseInt(
      execSync("pgrep -c node 2>/dev/null || echo 0", { encoding: "utf8" }).trim(),
      10
    )
    if (count > MAX_NODE_PROCS) {
      console.error(
        `\n⚠️  Runaway detected: ${count} node processes (limit ${MAX_NODE_PROCS}). Stopping dev server.\n`
      )
      clearInterval(watchdog)
      server.kill("SIGTERM")
      setTimeout(() => process.exit(1), 500)
    }
  } catch {
    // pgrep unavailable — skip this tick
  }
}, POLL_MS)

server.on("close", (code) => {
  clearInterval(watchdog)
  process.exit(code ?? 0)
})
