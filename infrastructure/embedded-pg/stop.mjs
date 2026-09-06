import EmbeddedPostgres from 'embedded-postgres';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_DIR = path.join(__dirname, 'data', 'db');

const pg = new EmbeddedPostgres({ databaseDir: DB_DIR, port: 5432, persistent: true });

try {
  await pg.stop();
  console.log('[embedded-postgres] Database stopped.');
} catch (err) {
  console.error('[embedded-postgres] Stop failed (was it running?):', err.message);
  process.exitCode = 1;
}
