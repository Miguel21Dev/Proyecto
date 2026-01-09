const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const { Pool } = require('pg');
const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de la base de datos (por defecto igual que `conexion.php`).
const pgConfig = {
  host: process.env.PGHOST || '127.0.0.1',
  port: process.env.PGPORT || 5432,
  database: process.env.PGDATABASE || 'mppop_tickets',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'NMG123456'
};

const pgPool = new Pool(pgConfig);
pgPool.connect().then(client => {
  client.release();
  console.log('Conectado a PostgreSQL:', pgConfig.host + ':' + pgConfig.port + '/' + pgConfig.database);
  // Si la conexión es exitosa, aseguramos que la tabla `tickets` exista
  (async function ensureTables() {
    try {
      const createTickets = `CREATE TABLE IF NOT EXISTS tickets (
        id SERIAL PRIMARY KEY,
        ticket_id VARCHAR(50) UNIQUE NOT NULL,
        nombre_completo VARCHAR(100) NOT NULL,
        departamento VARCHAR(100) NOT NULL,
        asunto VARCHAR(200) NOT NULL,
        prioridad VARCHAR(20) DEFAULT '',
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        estado VARCHAR(20) DEFAULT 'Abierto',
        tecnico VARCHAR(100) DEFAULT '',
        email VARCHAR(100),
        telefono VARCHAR(20),
        descripcion TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`;

      await pgPool.query(createTickets);
      console.log('Tabla `tickets` verificada/creada en PostgreSQL');
    } catch (err) {
      console.error('Error creando/verificando la tabla tickets:', err.message);
    }
  })();
}).catch(err => {
  console.warn('No se pudo conectar a PostgreSQL (quedará como fallback archivos JSON):', err.message);
});

// Middleware para parsear JSON
app.use(express.json());
// Middleware para parsear bodies URL-encoded (formularios)
app.use(express.urlencoded({ extended: true }));

// Servir la carpeta `vista` como raíz de archivos estáticos (HTML/CSS/imagenes)
app.use(express.static(path.join(__dirname, "vista")));

// Servir la carpeta de controladores (JS del cliente) y su subcarpeta `js`
app.use("/controlador", express.static(path.join(__dirname, "controlador")));
app.use("/js", express.static(path.join(__dirname, "controlador", "js")));
// Exponer modelo si es necesario (por ejemplo para archivos JSON en desarrollo)
app.use("/modelo", express.static(path.join(__dirname, "modelo")));

// Código de autenticación válido
const VALID_AUTH_CODE = "REG2024";

// Función para generar nombre de usuario
function generarUsername(nombreCompleto, cedula) {
  const primerNombre = nombreCompleto.split(" ")[0].toLowerCase();
  const primerasTresLetras = primerNombre.substring(0, 3);
  const ultimosCuatroDigitos = cedula.slice(-4);
  return primerasTresLetras + ultimosCuatroDigitos;
}

// Ruta principal - servir el HTML
app.get("/", (req, res) => {
  // Página de inicio: mostramos la vista principal
  res.sendFile(path.join(__dirname, "vista", "vis_ventanaPrincipal.html"));
});

// Ruta para el registro de usuarios
app.post("/register", async (req, res) => {
  try {
    const { name, cedula, authCode } = req.body;

    if (!name || !cedula || !authCode) {
      return res.status(400).json({
        error: "Todos los campos son obligatorios",
      });
    }

    if (authCode !== VALID_AUTH_CODE) {
      return res.status(401).json({
        error: "Código de autenticación incorrecto",
      });
    }

    if (!/^\d+$/.test(cedula)) {
      return res.status(400).json({
        error: "La cédula debe contener solo números",
      });
    }

    const usersFilePath = path.join(__dirname, "modelo", "users.json");
    let users = [];

    try {
      const data = await fs.readFile(usersFilePath, "utf8");
      users = JSON.parse(data);
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }

    const username = generarUsername(name, cedula);

    const userExists = users.some(
      (user) => user.cedula === cedula || user.username === username
    );

    if (userExists) {
      return res.status(409).json({
        error: "El usuario ya está registrado",
      });
    }

    const newUser = {
      id: Date.now().toString(),
      name,
      cedula,
      username,
      registrationDate: new Date().toISOString(),
      authCodeUsed: authCode,
    };

    users.push(newUser);

    // Asegurar que la carpeta modelo existe
    await fs.mkdir(path.dirname(usersFilePath), { recursive: true });
    await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2));

    res.status(201).json({
      message: "Usuario registrado exitosamente",
      username: username,
      userId: newUser.id,
    });
  } catch (error) {
    console.error("Error en el registro:", error);
    res.status(500).json({
      error: "Error interno del servidor",
    });
  }
});

// Ruta para login
app.post("/login", async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({
        error: "El nombre de usuario es requerido",
      });
    }

    const usersFilePath = path.join(__dirname, "modelo", "users.json");
    let users = [];

    try {
      const data = await fs.readFile(usersFilePath, "utf8");
      users = JSON.parse(data);
    } catch (error) {
      return res.status(404).json({
        error: "No hay usuarios registrados",
      });
    }

    const user = users.find((u) => u.username === username);

    if (!user) {
      return res.status(404).json({
        error: "Usuario no encontrado",
      });
    }

    res.json({
      message: "Login exitoso",
      user: {
        name: user.name,
        cedula: user.cedula,
        username: user.username,
      },
    });
  } catch (error) {
    console.error("Error en el login:", error);
    res.status(500).json({
      error: "Error interno del servidor",
    });
  }
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor ejecutándose en http://0.0.0.0:${PORT} (process.env.PORT=${process.env.PORT || ''})`);
});

server.on('error', (err) => {
  console.error('Error al iniciar el servidor:', err);
});

// Endpoint compatible para crear tickets (sustituye ejecución PHP cuando no haya motor PHP)
app.post('/controlador/php/tickets.php', async (req, res) => {
  try {
    const accion = req.body.accion || '';

    if (accion !== 'crear') {
      return res.json({ success: false, message: 'Acción no válida' });
    }

    const nombre = req.body.nombre || '';
    const departamento = req.body.departamento || '';
    const asunto = req.body.asunto || '';

    if (!nombre || !departamento || !asunto) {
      return res.json({ success: false, message: 'Datos incompletos' });
    }

    // Generar ticket_id
    const prefix = 'TCK-' + new Date().getFullYear() + '-';
    const timestamp = Date.now().toString().slice(-6);
    const ticket_id = prefix + timestamp;

    // Intentar insertar en PostgreSQL
    try {
      const insertSql = `INSERT INTO tickets (ticket_id, nombre_completo, departamento, asunto, prioridad, estado, tecnico)
        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING ticket_id, fecha`; 

      const values = [ticket_id, nombre, departamento, asunto, '', 'Abierto', ''];
      const result = await pgPool.query(insertSql, values);
      const returned = result.rows[0] || {};

      return res.json({
        success: true,
        message: 'Ticket creado en PostgreSQL',
        ticket_id: returned.ticket_id || ticket_id,
        data: {
          id: returned.ticket_id || ticket_id,
          asunto,
          prioridad: '',
          fecha: returned.fecha || new Date().toLocaleDateString('es-ES'),
          estado: 'Abierto',
          tecnico: ''
        }
      });

    } catch (dbErr) {
      console.warn('Error al insertar en PostgreSQL, usando fallback JSON:', dbErr.message);

      // Fallback a archivo JSON si la inserción en la DB falla
      const ticketsFilePath = path.join(__dirname, 'modelo', 'tickets.json');
      let tickets = [];

      try {
        const data = await fs.readFile(ticketsFilePath, 'utf8');
        tickets = JSON.parse(data);
      } catch (e) {
        if (e.code !== 'ENOENT') throw e;
      }

      const newTicket = {
        ticket_id,
        nombre_completo: nombre,
        departamento,
        asunto,
        prioridad: '',
        fecha: new Date().toISOString(),
        estado: 'Abierto',
        tecnico: ''
      };

      tickets.push(newTicket);
      await fs.mkdir(path.dirname(ticketsFilePath), { recursive: true });
      await fs.writeFile(ticketsFilePath, JSON.stringify(tickets, null, 2));

      return res.json({
        success: true,
        message: 'Ticket creado en archivo (fallback)',
        ticket_id,
        data: newTicket
      });
    }

  } catch (err) {
    console.error('Error en endpoint tickets:', err);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});