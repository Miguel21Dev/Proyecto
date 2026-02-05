const { Client } = require('pg');

const config = {
  host: process.env.PGHOST || '127.0.0.1',
  port: process.env.PGPORT || 5432,
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || '123',
};

async function main() {
  const adminClient = new Client({ ...config, database: 'postgres' });
  try {
    await adminClient.connect();
    console.log('Conectado al servidor PostgreSQL como', config.user);

    const dbName = process.env.PGDATABASE || 'mppop_tickets';

    const existsRes = await adminClient.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    if (existsRes.rowCount === 0) {
      console.log('Base de datos no encontrada, creando:', dbName);
      await adminClient.query(`CREATE DATABASE "${dbName}"`);
      console.log('Base de datos creada:', dbName);
    } else {
      console.log('Base de datos ya existe:', dbName);
    }

    await adminClient.end();

    // Conectar a la nueva base de datos y crear tablas
    const appClient = new Client({ ...config, database: dbName });
    await appClient.connect();
    console.log('Conectado a la base de datos:', dbName);

    const createTickets = `CREATE TABLE IF NOT EXISTS tickets (
      id SERIAL PRIMARY KEY,
      nombre_completo VARCHAR(100) NOT NULL,
      departamento VARCHAR(100) NOT NULL,
      asunto VARCHAR(200) NOT NULL,
      prioridad VARCHAR(20) DEFAULT '',
      fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      estado VARCHAR(20) DEFAULT 'Abierto',
      tecnico VARCHAR(100) DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;

    const createUsuarios = `CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      nombre VARCHAR(100) NOT NULL,
      rol VARCHAR(20) NOT NULL,
      authCode VARCHAR(20) NOT NULL,
      activo BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;

    await appClient.query(createTickets);
    console.log('Tabla tickets creada/verificada.');
    await appClient.query(createUsuarios);
    console.log('Tabla usuarios creada/verificada.');

    await appClient.end();
    console.log('Proceso completado.');
  } catch (err) {
    console.error('Error en create_db.js:', err.message);
    try { await adminClient.end(); } catch(e){}
    process.exit(1);
  }
}

main();
