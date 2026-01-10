const { Client } = require('pg');
const config = {
  host: process.env.PGHOST || '127.0.0.1',
  port: process.env.PGPORT || 5432,
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'NMG123456',
  database: process.env.PGDATABASE || 'postgres'
};
(async () => {
  const client = new Client(config);
  try {
    await client.connect();
    const res = await client.query("SELECT datname FROM pg_database WHERE datistemplate = false;");
    console.log('Databases:');
    res.rows.forEach(r => console.log('- ' + r.datname));
    await client.end();
  } catch (e) {
    console.error('ERROR:', e.message);
    try { await client.end(); } catch(e){}
    process.exit(1);
  }
})();
