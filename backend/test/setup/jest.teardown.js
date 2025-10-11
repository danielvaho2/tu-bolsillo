import { pool } from '../../src/config/db.config.js';

afterAll(async () => {
  await pool.end();
});
