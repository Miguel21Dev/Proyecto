const { pool } = require("../modelo/conexion");
const Ticket = require("../modelo/mod_tickets");

const crearTicket = async (req, res) => {
  try {
    const datos = req.body;
    const respuesta = await Ticket.crearTicket(datos);

    if (respuesta.success) {
      res.status(200).json(respuesta);
      return;
    }

    res.status(500).json(respuesta);
  } catch (error) {
    console.error("Error en crearTicket:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//de aqui hacia abajo no está en uso
// Obtener todos los tickets para el admin
const obtenerTicketsAdmin = async () => {
  try {
    const sql = `SELECT 
                ticket_id as id,
                asunto,
                prioridad,
                TO_CHAR(fecha, 'DD/MM/YYYY') as fecha,
                estado,
                tecnico,
                nombre_completo,
                departamento
                FROM tickets 
                ORDER BY 
                    CASE 
                        WHEN prioridad = 'alta' THEN 1
                        WHEN prioridad = 'media' THEN 2
                        WHEN prioridad = 'baja' THEN 3
                        ELSE 4
                    END,
                    fecha DESC`;

    const result = await this.pool.query(sql);

    return { success: true, tickets: result.rows };
  } catch (error) {
    return {
      success: false,
      message: "Error al obtener tickets: " + error.message,
    };
  }
};

// Obtener tickets asignados a un técnico específico
const obtenerTicketsTecnico = async (tecnico_nombre) => {
  try {
    const sql = `SELECT 
                ticket_id as id,
                asunto,
                prioridad,
                TO_CHAR(fecha, 'DD/MM/YYYY') as fecha,
                estado,
                tecnico,
                nombre_completo,
                departamento
                FROM tickets 
                WHERE tecnico = $1
                ORDER BY 
                    CASE 
                        WHEN prioridad = 'alta' THEN 1
                        WHEN prioridad = 'media' THEN 2
                        WHEN prioridad = 'baja' THEN 3
                        ELSE 4
                    END,
                    fecha DESC`;

    const result = await this.pool.query(sql, [tecnico_nombre]);

    return { success: true, tickets: result.rows };
  } catch (error) {
    return {
      success: false,
      message: "Error al obtener tickets: " + error.message,
    };
  }
};

// Asignar técnico y prioridad a un ticket
const asignarTicket = async (ticket_id, prioridad, tecnico_codigo) => {
  try {
    // Obtener nombre del técnico basado en el código
    const nombre_tecnico = await this.obtenerNombreTecnico(tecnico_codigo);

    if (!nombre_tecnico) {
      return { success: false, message: "Técnico no encontrado" };
    }

    const sql = `UPDATE tickets 
                    SET prioridad = $1, 
                        tecnico = $2,
                        estado = 'Activo'
                    WHERE ticket_id = $3
                    RETURNING *`;

    const result = await this.pool.query(sql, [
      prioridad,
      nombre_tecnico,
      ticket_id,
    ]);

    if (result.rowCount > 0) {
      const ticketActualizado = result.rows[0];
      return {
        success: true,
        message: "Ticket asignado correctamente",
        ticket: {
          id: ticketActualizado.ticket_id,
          prioridad: ticketActualizado.prioridad,
          tecnico: ticketActualizado.tecnico,
          estado: ticketActualizado.estado,
        },
      };
    } else {
      return { success: false, message: "Ticket no encontrado" };
    }
  } catch (error) {
    return {
      success: false,
      message: "Error al asignar ticket: " + error.message,
    };
  }
};

// Actualizar estado de un ticket (para técnicos)
const actualizarEstado = async (
  ticket_id,
  nuevo_estado,
  tecnico_nombre = null
) => {
  try {
    let sql = `UPDATE tickets SET estado = $1 WHERE ticket_id = $2`;
    let params = [nuevo_estado, ticket_id];

    // Si se proporciona nombre de técnico, verificar que es el asignado
    if (tecnico_nombre) {
      sql += ` AND tecnico = $3`;
      params.push(tecnico_nombre);
    }

    sql += ` RETURNING *`;

    const result = await this.pool.query(sql, params);

    if (result.rowCount > 0) {
      return {
        success: true,
        message: "Estado actualizado correctamente",
        ticket: result.rows[0],
      };
    } else {
      return {
        success: false,
        message: "Ticket no encontrado o no tienes permisos",
      };
    }
  } catch (error) {
    return {
      success: false,
      message: "Error al actualizar estado: " + error.message,
    };
  }
};

// Tomar un ticket (cambiar a "En proceso")
const tomarTicket = async (ticket_id, tecnico_nombre) => {
  return await this.actualizarEstado(ticket_id, "En proceso", tecnico_nombre);
};

// Eliminar un ticket
const eliminarTicket = async (ticket_id) => {
  try {
    const sql = `DELETE FROM tickets WHERE ticket_id = $1`;

    const result = await this.pool.query(sql, [ticket_id]);

    if (result.rowCount > 0) {
      return { success: true, message: "Ticket eliminado correctamente" };
    } else {
      return { success: false, message: "Ticket no encontrado" };
    }
  } catch (error) {
    return {
      success: false,
      message: "Error al eliminar ticket: " + error.message,
    };
  }
};

// Obtener un ticket específico
const obtenerTicket = async (ticket_id) => {
  try {
    const sql = `SELECT * FROM tickets WHERE ticket_id = $1`;

    const result = await this.pool.query(sql, [ticket_id]);

    if (result.rowCount > 0) {
      const ticket = result.rows[0];
      return {
        success: true,
        ticket: {
          id: ticket.ticket_id,
          asunto: ticket.asunto,
          nombre_completo: ticket.nombre_completo,
          departamento: ticket.departamento,
          prioridad: ticket.prioridad,
          fecha: this.formatDate(ticket.fecha),
          estado: ticket.estado,
          tecnico: ticket.tecnico,
        },
      };
    } else {
      return { success: false, message: "Ticket no encontrado" };
    }
  } catch (error) {
    return {
      success: false,
      message: "Error al obtener ticket: " + error.message,
    };
  }
};

// Obtener lista de técnicos activos
const obtenerTecnicos = async () => {
  try {
    const sql = `SELECT id, nombre FROM usuarios WHERE rol = 'tecnico' AND activo = true ORDER BY nombre`;

    const result = await this.pool.query(sql);

    return { success: true, tecnicos: result.rows };
  } catch (error) {
    return {
      success: false,
      message: "Error al obtener técnicos: " + error.message,
    };
  }
};

// Obtener nombre del técnico por código
const obtenerNombreTecnico = async (codigo) => {
  try {
    // Si es un número, buscar por ID
    if (!isNaN(codigo)) {
      const sql = `SELECT nombre FROM usuarios WHERE id = $1 AND rol = 'tecnico'`;
      const result = await this.pool.query(sql, [codigo]);

      if (result.rowCount > 0) {
        return result.rows[0].nombre;
      }
    }

    // Si no es número, asumir que ya es el nombre
    return codigo;
  } catch (error) {
    return null;
  }
};

// Función auxiliar para formatear fecha
const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${d.getFullYear()}`;
};

module.exports = {
  actualizarEstado,
  asignarTicket,
  crearTicket,
  eliminarTicket,
  obtenerTicketsAdmin,
  obtenerTicketsTecnico,
  obtenerNombreTecnico,
  obtenerTecnicos,
  obtenerTicket,
};
