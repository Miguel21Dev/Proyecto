const express = require("express");
const app = express();

const path = require("path");

const PORT = process.env.PORT || 3000;

const conUsuarios = require('./controlador/con_usuarios')
const conTickets = require('./controlador/con_tickets')
const conHistorial = require('./controlador/con_historial')

// Middleware para parsear JSON
app.use(express.json());
// Middleware para parsear bodies URL-encoded (formularios)
app.use(express.urlencoded({ extended: true }));
// // Servir la carpeta `vista` como raíz de archivos estáticos (HTML/CSS/imagenes)
app.use(express.static(path.join(__dirname, "vista")));



app.get("/", (req, res) => {
  // Página de inicio: mostramos la vista principal
  res.sendFile(path.join(__dirname, "vista", "vis_ventanaPrincipal.html"));
});

app.post('/usuarios/registrar', conUsuarios.registrar)
app.post('/usuarios/autenticar', conUsuarios.autenticar) 
app.get('/usuarios/tecnicos', conUsuarios.obtenerTecnicos)
 
app.post('/tickets/crearTicket', conTickets.crearTicket)
app.get('/tickets/obtenerTicketsAdmin', conTickets.obtenerTicketsAdmin)
app.post('/tickets/asignarTicket', conTickets.asignarTicket)
app.post('/tickets/eliminarTicket', conTickets.eliminarTicket)
app.get('/tickets/tecnico/:username', conTickets.obtenerTicketsPorTecnico);
app.get('/tickets/:id', conTickets.obtenerTicketPorId);       
app.put('/tickets/:id/estado', conTickets.actualizarEstadoTicket);
// Historial: mostrar finalizados y generar descargas
app.get('/historial/finalizados', conHistorial.mostrarFinalizados);
app.get('/historial/descarga', conHistorial.generarDescarga);

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor ejecutándose en http://0.0.0.0:${PORT} (process.env.PORT=${process.env.PORT || ''})`);
});

server.on('error', (err) => {
  console.error('Error al iniciar el servidor:', err);
});
 