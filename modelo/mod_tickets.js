const { pool } = require("../modelo/conexion");

class Ticket {
  // Crear tickets
  static async crearTicket(datos) {
    try {
      const sql = `INSERT INTO tickets (
                nombre_completo, 
                departamento, 
                asunto, 
                estado,
                fecha,
                prioridad,
                tecnico
            ) VALUES ($1, $2, $3, 'abierto', NOW(), '', '')
            RETURNING *`;

      const values = [datos.nombre, datos.departamento, datos.asunto];

      const result = await pool.query(sql, values);

      if (result.rowCount > 0) {
        return { success: true, ticket: result.rows[0] };
      }

      return { success: false, message: "No se pudo crear el ticket" };
    } catch (error) {
      console.error("Error en modelo Ticket.crear:", error);
      return {
        success: false,
        message: "Error en la base de datos: " + error.message,
      };
    }
  }

  // Admin obtiene todos los tickets
  static async obtenerTicketsAdmin() {
    try {
const sql = `SELECT 
                t.id,
                t.asunto,
                t.prioridad,
                TO_CHAR(t.fecha, 'DD/MM/YYYY') as fecha,
                t.estado,
                u.nombre as tecnico,
                t.nombre_completo,
                t.departamento
            FROM tickets t
            LEFT JOIN usuarios u ON t.tecnico = u.id::text 
            WHERE t.estado != 'finalizado'
            ORDER BY 
                CASE 
                    WHEN t.prioridad = 'alta' THEN 1
                    WHEN t.prioridad = 'media' THEN 2
                    WHEN t.prioridad = 'baja' THEN 3
                    ELSE 4
                END,
                t.fecha DESC`;

      const result = await pool.query(sql);

      return { success: true, tickets: result.rows };
    } catch (error) {
      return {
        success: false,
        message: "Error al obtener tickets: " + error.message,
      };
    }
  }

  // Guarda técnicos en la lista desplegable
  static async obtenerNombreTecnico(codigo) {
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
  }

  // Admin asigna técnico y prioridad a un ticket
  static async asignarTicket(ticket_id, prioridad, tecnico_codigo) {
    console.log(ticket_id, prioridad, tecnico_codigo);
    try {
      const sql = `UPDATE tickets 
                     SET prioridad = $1, 
                         tecnico = $2,
                         estado = 'Activo'
                     WHERE id = $3
                     RETURNING *`;

      const result = await pool.query(sql, [
        prioridad,
        tecnico_codigo,
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
  }

  // Obtener tickets por técnico (username)
  static async obtenerPorTecnico(username) {
    try {
      // Buscar tickets directamente por username del técnico
      // Asumiendo que en tickets.tecnico guardas el username, no el nombre
      const sql = `SELECT 
                    id,
                    asunto,
                    prioridad,
                    TO_CHAR(fecha, 'DD/MM/YYYY') as fecha,
                    estado,
                    tecnico,
                    nombre_completo,
                    departamento
                FROM tickets 
                WHERE tecnico = $1 AND estado != 'finalizado'
                ORDER BY fecha DESC`;

      const result = await pool.query(sql, [username]);

      return {
        success: true,
        tickets: result.rows,
      };
    } catch (error) {
      console.error("Error en obtenerPorTecnico:", error);
      return {
        success: false,
        message: "Error en la base de datos",
      };
    }
  }

  // Obtener un ticket por ID
  static async obtenerTicketPorId(id) {
    try {
    const sql = `SELECT 
                t.id,
                t.asunto,
                t.prioridad,
                TO_CHAR(t.fecha, 'DD/MM/YYYY') as fecha,
                t.estado,
                u.nombre as tecnico,  
                t.nombre_completo,
                t.departamento
            FROM tickets t
            LEFT JOIN usuarios u ON t.tecnico = u.id::text 
            WHERE t.id = $1`;

      const result = await pool.query(sql, [id]);

      if (result.rows.length > 0) {
        return {
          success: true,
          ticket: result.rows[0],
        };
      } else {
        return {
          success: false,
          message: "Ticket no encontrado",
        };
      }
    } catch (error) {
      console.error("Error en obtenerTicketPorId:", error);
      return {
        success: false,
        message: "Error en la base de datos",
      };
    }
  }

  // Actualizar estado de un ticket
  static async actualizarEstado(id, estado, userId) {
    try {
      // Actualizar ticket
      const sql = `UPDATE tickets 
                    SET estado = $1, 
                        tecnico = $2
                    WHERE id = $3 
                    RETURNING *`;

      const result = await pool.query(sql, [estado, userId, id]);

      if (result.rowCount > 0) {
        return {
          success: true,
          message: "Estado actualizado",
          ticket: result.rows[0],
        };
      } else {
        return {
          success: false,
          message: "Ticket no encontrado",
        };
      }
    } catch (error) {
      console.error("Error en actualizarEstado:", error);
      return {
        success: false,
        message: "Error en la base de datos",
      };
    }
  }
}

module.exports = Ticket;
