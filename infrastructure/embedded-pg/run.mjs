import EmbeddedPostgres from 'embedded-postgres';
import { execSync, spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../..');
const DB_DIR = path.join(__dirname, 'data', 'db');
const DATABASE_PKG = path.join(REPO_ROOT, 'packages', 'database');
const API_PKG = path.join(REPO_ROOT, 'apps', 'api');
const PORT = 5432;
const USER = 'mesi';
const PASSWORD = 'mesi';

function run(cmd) {
  console.log(`\n> ${cmd}`);
  const out = execSync(cmd, { cwd: DATABASE_PKG, env: process.env, stdio: 'inherit' });
  return out;
}

async function main() {
  try {
    await stopExisting();
  } catch {}

  const pg = new EmbeddedPostgres({
    databaseDir: DB_DIR,
    user: USER,
    password: PASSWORD,
    port: PORT,
    persistent: true,
  });

  console.log('\n[embedded-postgres] Initialising cluster...');
  await pg.initialise();
  console.log('[embedded-postgres] Starting server on :5432...');
  await pg.start();
  console.log('[embedded-postgres] Running.');

  // Ensure the `mesi` database exists
  const client = pg.getPgClient();
  await client.connect();
  const res = await client.query("SELECT 1 FROM pg_database WHERE datname='mesi'");
  if (res.rowCount === 0) {
    await pg.createDatabase('mesi');
    console.log('[embedded-postgres] Created database "mesi".');
  } else {
    console.log('[embedded-postgres] Database "mesi" already exists.');
  }
  await client.end();

  // Sync schema + seed
  console.log('\n[prisma] db push (schema -> database)...');
  run('npx prisma db push --skip-generate');
  console.log('\n[prisma] seed...');
  run('npx prisma db seed');

  // Boot the API
  console.log('\n[api] Starting MESI API...');
  const api = spawn(process.execPath, ['dist/main.js'], {
    cwd: API_PKG,
    env: process.env,
    stdio: 'inherit',
  });

  const shutdown = async () => {
    console.log('\n[api] Stopping API...');
    try { api.kill('SIGTERM'); } catch {}
    console.log('[embedded-postgres] Stopping database...');
    try { await pg.stop(); } catch {}
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  api.on('exit', async () => {
    console.log('[api] exited. Stopping database...');
    try { await pg.stop(); } catch {}
    process.exit(0);
  });
}

async function stopExisting() {
  // Best-effort: stop a cluster in the same data dir without touching a running one's port lock
  const pg = new EmbeddedPostgres({ databaseDir: DB_DIR, port: PORT, persistent: true });
  try {
    await pg.stop();
    console.log('[embedded-postgres] Stopped previous cluster.');
  } catch {}
}

main().catch((err) => {
  console.error('\n[run] Failed:', err);
  process.exit(1);
});
