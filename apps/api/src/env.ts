import * as path from 'path';
import * as dotenv from 'dotenv';

// Load the monorepo-root .env before any module that reads process.env.
// npm scripts run with cwd = apps/api, so two levels up is the repo root.
dotenv.config({
  path: path.resolve(process.cwd(), '../../.env'),
});
