/**
 * Open the public site or admin login in the default browser.
 * Ensures the local Next.js server is running on PORT (default 3000).
 *
 * Usage: node scripts/site.mjs client|admin|stop
 */
import { spawn, execSync } from "node:child_process";
import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const port = Number(process.env.PORT || 3000);
const base = `http://localhost:${port}`;

const target = (process.argv[2] || "").toLowerCase();

const urls = {
  client: `${base}/`,
  admin: `${base}/admin/login`,
};

function waitForServer(ms = 60_000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      const req = http.get(base, (res) => {
        res.resume();
        resolve(true);
      });
      req.on("error", () => {
        if (Date.now() - start > ms) reject(new Error(`Server not ready at ${base}`));
        else setTimeout(tryOnce, 500);
      });
      req.setTimeout(1500, () => {
        req.destroy();
      });
    };
    tryOnce();
  });
}

function isServerUp() {
  return new Promise((resolve) => {
    const req = http.get(base, (res) => {
      res.resume();
      resolve(true);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(1200, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function openBrowser(url) {
  const platform = process.platform;
  if (platform === "win32") {
    spawn("cmd", ["/c", "start", "", url], { detached: true, stdio: "ignore" }).unref();
  } else if (platform === "darwin") {
    spawn("open", [url], { detached: true, stdio: "ignore" }).unref();
  } else {
    spawn("xdg-open", [url], { detached: true, stdio: "ignore" }).unref();
  }
}

function pidFile() {
  return path.join(root, ".next", "ggcc-server.pid");
}

function stopServer() {
  const file = pidFile();
  let killed = false;

  if (fs.existsSync(file)) {
    try {
      const pid = Number(fs.readFileSync(file, "utf8").trim());
      if (pid) {
        try {
          process.kill(pid);
          killed = true;
          console.log(`Stopped server process ${pid}`);
        } catch {
          // already gone
        }
      }
    } catch {
      // ignore
    }
    try {
      fs.unlinkSync(file);
    } catch {
      // ignore
    }
  }

  if (process.platform === "win32") {
    try {
      execSync(
        `powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"`,
        { stdio: "ignore" },
      );
      killed = true;
    } catch {
      // ignore
    }
  } else {
    try {
      execSync(`lsof -ti tcp:${port} | xargs -r kill -9`, { stdio: "ignore" });
      killed = true;
    } catch {
      // ignore
    }
  }

  console.log(killed ? `Port ${port} cleared.` : `Nothing listening on port ${port}.`);
}

async function ensureServer() {
  if (await isServerUp()) {
    console.log(`Server already running at ${base}`);
    return;
  }

  const nextDir = path.join(root, ".next");
  if (!fs.existsSync(nextDir)) {
    console.error("No production build found. Run: npm run build");
    process.exit(1);
  }

  console.log(`Starting Next.js on ${base} ...`);
  const nextCli = path.join(root, "node_modules", "next", "dist", "bin", "next");
  const child = spawn(process.execPath, [nextCli, "start", "-p", String(port)], {
    cwd: root,
    detached: true,
    stdio: "ignore",
    windowsHide: true,
    env: { ...process.env, PORT: String(port) },
  });
  child.unref();

  fs.mkdirSync(nextDir, { recursive: true });
  fs.writeFileSync(pidFile(), String(child.pid ?? ""), "utf8");

  await waitForServer();
  console.log("Server ready.");
}

async function main() {
  if (target === "stop") {
    stopServer();
    return;
  }

  if (target !== "client" && target !== "admin") {
    console.error("Usage: node scripts/site.mjs <client|admin|stop>");
    process.exit(1);
  }

  await ensureServer();
  const url = urls[target];
  console.log(`Opening ${url}`);
  openBrowser(url);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
