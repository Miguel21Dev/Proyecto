const { Client } = require('pg');

const config = {
  host: process.env.PGHOST || '127.0.0.1',
  port: process.env.PGPORT || 5432,
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'NMG123456',
  database: process.env.PGDATABASE || 'mppop_tickets'
};

(async () => {
  const client = new Client(config);
  try {
    await client.connect();
    console.log('Conectado a PostgreSQL, consultando tabla tickets...');
    const res = await client.query(`SELECT ticket_id, nombre_completo, departamento, asunto, prioridad, estado, fecha
                                    FROM tickets
                                    ORDER BY fecha DESC
                                    LIMIT 10`);
    if (res.rows.length === 0) {
      console.log('No hay registros en la tabla tickets.');
    } else {
      console.log('Resultados (hasta 10):');
      console.log(JSON.stringify(res.rows, null, 2));
    }
    await client.end();
  } catch (err) {
    console.error('Error al consultar tickets:', err.message);
    try { await client.end(); } catch(e){}
    process.exit(1);
  }
})();
