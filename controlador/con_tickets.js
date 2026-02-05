const { pool } = require('../modelo/conexion')
const Ticket = require('../modelo/mod_tickets')


const crearTicket = async (req, res) => {
    try {
       
        const datos = req.body;
        const respuesta = await Ticket.crearTicket(datos)

        if(respuesta.success) {
            res.status(200).json(respuesta)
            return
        } 

        res.status(500).json(respuesta)
    } catch (error) {
        
        console.error('Error en crearTicket:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

const obtenerTicketsAdmin = async (req, res) => {
    try {
       
        const respuesta = await Ticket.obtenerTicketsAdmin()

        if(respuesta.success) {
            res.status(200).json(respuesta)
            return
        } 

        res.status(500).json(respuesta)
    } catch (error) {
        
        console.error('Error al obtenerTicketAdmin:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

const asignarTicket = async (req, res) => {
    try {
       
        const {ticket_id, prioridad, tecnico_codigo} = req.body;
        const respuesta = await Ticket.asignarTicket(ticket_id, prioridad, tecnico_codigo)

        if(respuesta.success) {
            res.status(200).json(respuesta)
            return
        } 

        res.status(500).json(respuesta)
    } catch (error) {
        
        console.error('Error al asignarTicket:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

 const obtenerTicketsPorTecnico = async (req, res) => {
    try {
        const { username } = req.params;
        const resultado = await Ticket.obtenerPorTecnico(username);
        
        if (resultado.success) {
            res.json({
                success: true,
                data: resultado.tickets
            });
        } else {
            res.status(404).json({
                success: false,
                message: resultado.message || 'No se encontraron tickets'
            });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error del servidor'
        });
    }
};



// Obtener lista de técnicos activos (handler HTTP)
const obtenerTecnicos = async (req, res) => {
    try {
        const sql = `SELECT id, nombre, username FROM usuarios WHERE rol = 'tecnico' AND activo = true ORDER BY nombre`;
        const result = await pool.query(sql);

        res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error al obtener técnicos:', error);
        res.status(500).json({ success: false, message: 'Error al obtener técnicos: ' + error.message });
    }
};

// Obtener ticket por ID (para ver detalles)
const obtenerTicketPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const respuesta = await Ticket.obtenerTicketPorId (id)
        res.status(respuesta.success?200:404).json(respuesta);
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error del servidor'
        });
    }
};

// Actualizar estado de ticket
const actualizarEstadoTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado, userId } = req.body;
        const respuesta = await Ticket.actualizarEstado (id, estado, userId)
                res.status(respuesta.success?200:404).json(respuesta);

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error del servidor'
        });
    }
};

// Eliminar un ticket (handler HTTP)
const eliminarTicket = async (req, res) => {
    try {
        const { ticket_id } = req.body || req.params || {};
        if (!ticket_id) {
            res.status(400).json({ success: false, message: 'Falta ticket_id' });
            return;
        }

        // Usamos `id` como nombre de columna; ajusta si tu esquema es diferente
        const sql = `DELETE FROM tickets WHERE id = $1`;
        const result = await pool.query(sql, [ticket_id]);

        if (result.rowCount > 0) {
            res.status(200).json({ success: true, message: 'Ticket eliminado correctamente' });
        } else {
            res.status(404).json({ success: false, message: 'Ticket no encontrado' });
        }
    } catch (error) {
        console.error('Error al eliminar ticket:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar ticket: ' + error.message });
    }
};

module.exports = { crearTicket, obtenerTicketsAdmin, obtenerTecnicos, asignarTicket, obtenerTicketsPorTecnico, obtenerTicketPorId, actualizarEstadoTicket, eliminarTicket }