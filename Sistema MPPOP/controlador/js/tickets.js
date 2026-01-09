// FUNCIONES ESPECÍFICAS PARA TICKETS

let tickets = [
    {id:"TCK-001", asunto:"Error en sistema", prioridad:"", fecha:"15/12/2024", estado:"Abierto", tecnico:""},
    {id:"TCK-002", asunto:"Solicitud acceso", prioridad:"media", fecha:"14/12/2024", estado:"En proceso", tecnico:"Juan Pérez"}
];

let ticketActual = null;

function cargarTablaTickets() {
    const tbody = document.getElementById('tablaTickets');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    tickets.forEach(ticket => {
        const fila = tbody.insertRow();
        const prioridad = ticket.prioridad ? 
            `<span class="badge badge-${ticket.prioridad}">${ticket.prioridad}</span>` : '-';
        
        fila.innerHTML = `
            <td>${ticket.id}</td>
            <td>${ticket.asunto}</td>
            <td>${prioridad}</td>
            <td>${ticket.fecha}</td>
            <td>${ticket.estado}</td>
            <td>${ticket.tecnico || '-'}</td>
            <td>
                <button class="btn-accion btn-ver" onclick="verTicket('${ticket.id}')">👁️</button>
                <button class="btn-accion btn-editar" onclick="abrirModalAsignar('${ticket.id}')">✏️</button>
                <button class="btn-accion btn-eliminar" onclick="eliminarTicket('${ticket.id}')">🗑️</button>
            </td>
        `;
    });
}

function abrirModalAsignar(id) {
    ticketActual = id;
    document.getElementById('ticketId').textContent = id;
    document.getElementById('modalAsignar').style.display = 'flex';
}

function cerrarModal() {
    document.getElementById('modalAsignar').style.display = 'none';
    ticketActual = null;
}

function guardarAsignacion() {
    const prioridad = document.getElementById('prioridad').value;
    const tecnico = document.getElementById('tecnico').value;
    
    if (!prioridad || !tecnico) {
        alert('Selecciona prioridad y técnico');
        return;
    }
    
    const ticket = tickets.find(t => t.id === ticketActual);
    if (ticket) {
        ticket.prioridad = prioridad;
        ticket.tecnico = tecnico === '1' ? 'Juan Pérez' : 'María González';
        if (ticket.estado === 'Abierto') ticket.estado = 'En proceso';
    }
    
    cargarTablaTickets();
    cerrarModal();
    alert('Ticket asignado');
}

function verTicket(id) {
    const ticket = tickets.find(t => t.id === id);
    alert(`Ticket ${id}\nAsunto: ${ticket.asunto}\nEstado: ${ticket.estado}`);
}

function eliminarTicket(id) {
    if (confirm('¿Eliminar ticket ' + id + '?')) {
        tickets = tickets.filter(t => t.id !== id);
        cargarTablaTickets();
    }
}

// Inicializar
if (document.getElementById('tablaTickets')) {
    cargarTablaTickets();
}

// Cerrar modal al hacer clic fuera
window.onclick = function(event) {
    const modal = document.getElementById('modalAsignar');
    if (event.target === modal) {
        cerrarModal();
    }
}