const Usuario = require("../modelo/mod_usuarios");

// Código de autenticación válido
const VALID_AUTH_CODE = "REG2024";

const registrar = async (req, res) => {
  try {
    const { name, cedula, authCode, rol } = req.body;

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

    const respuesta = await Usuario.registrar(req.body);

    if (respuesta.success) {
      res.status(200).json(respuesta);
      return;
    }

    if (respuesta.message.includes("está registrado")) {
      res.status(409).json(respuesta);
      return;
    }

    res.status(500).json(respuesta);
    return;
  } catch (error) {
    console.error("Error en el registro:", error);
    res.status(500).json({
      error: "Error interno del servidor",
    });
  }
};

const autenticar = async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({
        error: "El nombre de usuario es requerido",
      });
    }

    const respuesta = await Usuario.autenticar(username);
    res.status(respuesta.success ? 200 : 404).json(respuesta);
  } catch (error) {
    console.error("Error en el login:", error);
    res.status(500).json({
      error: "Error interno del servidor",
    });
  }
};

module.exports = { registrar, autenticar };
