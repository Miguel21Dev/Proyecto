// config/db.js
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.PGHOST || '127.0.0.1',
  port: process.env.PGPORT || 5432,
  database: process.env.PGDATABASE || 'mppop_tickets',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || '1234'
});

(async () => {
  try {
    const client = await pool.connect();
    // En PostgreSQL usamos SELECT 1 en lugar de ping()
    await client.query('SELECT 1');
    client.release();
    console.log('[DB] Pool PostgreSQL listo');
  } catch (e) {
    console.error('[DB] Error conectando a PostgreSQL:', e.message);
  }
})();

module.exports = { pool };