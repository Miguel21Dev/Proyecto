// TICKETS ASIGNADOS AL TÉCNICO ACTUAL
let ticketsTecnico = [
    {id:"TCK-001", asunto:"Error en sistema", prioridad:"alta", fecha:"15/12/2024", estado:"activo", tecnico:"Juan Pérez"},
    {id:"TCK-002", asunto:"Solicitud acceso", prioridad:"media", fecha:"14/12/2024", estado:"en proceso", tecnico:"Juan Pérez"}
];

function cargarTicketsTecnico() {
    const tbody = document.getElementById('tablaTicketsTecnico');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    ticketsTecnico.forEach(ticket => {
        const fila = tbody.insertRow();
        
        // Botón de estado (EDITABLE)
        const selectEstado = `
            <select class="select-mppop select-estado" 
                    onchange="cambiarEstado('${ticket.id}', this.value)"
                    style="width: 120px; padding: 5px;">
                <option value="activo" ${ticket.estado === 'activo' ? 'selected' : ''}>Activo</option>
                <option value="en proceso" ${ticket.estado === 'en proceso' ? 'selected' : ''}>En proceso</option>
                <option value="finalizado" ${ticket.estado === 'finalizado' ? 'selected' : ''}>Finalizado</option>
            </select>
        `;
        
        fila.innerHTML = `
            <td>${ticket.id}</td>
            <td>${ticket.asunto}</td>
            <td><span class="badge badge-${ticket.prioridad}">${ticket.prioridad}</span></td>
            <td>${ticket.fecha}</td>
            <td>${selectEstado}</td>
            <td>
                <button class="btn-accion btn-ver" onclick="verDetalles('${ticket.id}')">👁️</button>
                <button class="btn-accion" onclick="tomarTicket('${ticket.id}')" 
                        style="background: #e0f7fa; color: #0097a7;">
                    ✅ Tomar
                </button>
            </td>
        `;
    });
}

function cambiarEstado(ticketId, nuevoEstado) {
    const ticket = ticketsTecnico.find(t => t.id === ticketId);
    if (ticket) {
        ticket.estado = nuevoEstado;
        console.log(`Ticket ${ticketId} cambiado a: ${nuevoEstado}`);
        
        // Aquí enviaríamos al servidor
        // fetch(`/api/tickets/${ticketId}/estado`, {
        //     method: 'PUT',
        //     body: JSON.stringify({ estado: nuevoEstado })
        // });
    }
}

function tomarTicket(ticketId) {
    if (confirm('¿Tomar este ticket?')) {
        cambiarEstado(ticketId, 'en proceso');
        alert(`Ticket ${ticketId} tomado`);
    }
}

function verDetalles(ticketId) {
    const ticket = ticketsTecnico.find(t => t.id === ticketId);
    if (ticket) {
        alert(`📋 Ticket: ${ticket.id}\n📝 Asunto: ${ticket.asunto}\n⚡ Prioridad: ${ticket.prioridad}\n📅 Fecha: ${ticket.fecha}\n🔄 Estado: ${ticket.estado}`);
    }
}

// Inicializar
if (document.getElementById('tablaTicketsTecnico')) {
    cargarTicketsTecnico();
}