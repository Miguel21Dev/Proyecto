const { pool } = require('../modelo/conexion');

class Ticket {

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

            const values = [
                datos.nombre,
                datos.departamento,
                datos.asunto
            ];

            const result = await pool.query(sql, values);

            if (result.rowCount > 0) {
                return { success: true, ticket: result.rows[0] };
            }

            return { success: false, message: 'No se pudo crear el ticket' };
        } catch (error) {
            console.error('Error en modelo Ticket.crear:', error);
            return { success: false, message: 'Error en la base de datos: ' + error.message};
        }
    }


}

module.exports = Ticket;