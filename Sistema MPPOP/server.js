const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const app = express();
const PORT = 3000;

// Middleware para parsear JSON
app.use(express.json());
app.use(express.static(__dirname));

// Servir archivos estáticos desde las carpetas correctas
app.use("/css", express.static(path.join(__dirname, "css")));
app.use("/js", express.static(path.join(__dirname, "controlador")));

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
  res.sendFile(path.join(__dirname, "vista", "registro.html"));
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

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});