// vista/js/registro.js
document.addEventListener('DOMContentLoaded', function() {
    // Solo ejecutar si estamos en la página de registro
    if (!document.getElementById('registerForm')) return;
    
    inicializarRegistro();
});

function inicializarRegistro() {
    const nombreInput = document.getElementById('name');
    const cedulaInput = document.getElementById('cedula');
    const form = document.getElementById('registerForm');
    
    // Validar solo números en cédula
    cedulaInput.addEventListener('input', function(e) {
        this.value = this.value.replace(/\D/g, '');
        generarUsernamePreview();
    });
    
    // Generar preview de username cuando se escribe
    nombreInput.addEventListener('input', generarUsernamePreview);
    
    // Enviar formulario
    form.addEventListener('submit', registrarUsuario);
}

// Función para generar username
function generarUsername(nombreCompleto, cedula) {
    const primerNombre = nombreCompleto.split(" ")[0].toLowerCase();
    const primerasTresLetras = primerNombre.substring(0, 3);
    const ultimosCuatroDigitos = cedula.slice(-4);
    return primerasTresLetras + ultimosCuatroDigitos;
}

// Mostrar vista previa del username
function generarUsernamePreview() {
    const nombre = document.getElementById('name').value.trim();
    const cedula = document.getElementById('cedula').value;
    
    const previewDiv = document.getElementById('username-preview');
    const usernameSpan = document.getElementById('generatedUsername');
    
    if (nombre && cedula.length >= 4) {
        const username = generarUsername(nombre, cedula);
        usernameSpan.textContent = username;
        previewDiv.style.display = 'block';
    } else {
        previewDiv.style.display = 'none';
    }
}

// Registrar usuario
function registrarUsuario(event) {
    event.preventDefault();
    
    const nombre = document.getElementById('name').value;
    const cedula = document.getElementById('cedula').value;
    const rol = document.getElementById('rol').value;
    const authCode = document.getElementById('authCode').value;
    
    // Validaciones
    if (!validarDatos(nombre, cedula, rol, authCode)) {
        return;
    }
    
    // Mostrar loading
    mostrarLoading(true);
    
    // Simular envío al servidor (después lo reemplazas con fetch real)
    setTimeout(() => {
        procesarRegistro(nombre, cedula, rol, authCode);
    }, 1500);
}

// Validar datos del formulario
function validarDatos(nombre, cedula, rol, authCode) {
    // Validar nombre
    if (nombre.trim().split(' ').length < 2) {
        alert('Por favor ingresa nombre y apellido');
        return false;
    }
    
    // Validar cédula
    if (cedula.length !== 8 || isNaN(cedula)) {
        alert('La cédula debe tener exactamente 8 dígitos numéricos');
        return false;
    }
    
    // Validar rol
    if (!rol) {
        alert('Por favor selecciona un rol');
        return false;
    }
    
    // Validar código de autenticación
    if (!authCode.trim()) {
        alert('El código de autenticación es requerido');
        return false;
    }
    
    return true;
}

// Mostrar/ocultar loading
function mostrarLoading(mostrar) {
    const btnText = document.getElementById('btnText');
    const loader = document.getElementById('loader');
    
    if (mostrar) {
        btnText.style.display = 'none';
        loader.style.display = 'inline-block';
        document.getElementById('submitBtn').disabled = true;
    } else {
        btnText.style.display = 'inline';
        loader.style.display = 'none';
        document.getElementById('submitBtn').disabled = false;
    }
}

// Procesar registro exitoso
function procesarRegistro(nombre, cedula, rol, authCode) {
    // Generar username final
    const username = generarUsername(nombre, cedula);
    
    // Aquí normalmente enviarías los datos al servidor:
    // fetch('/api/registrar', { method: 'POST', body: JSON.stringify({...}) })
    
    // Simular respuesta del servidor
    console.log('Usuario registrado:', {
        nombre,
        cedula,
        username,
        rol,
        fecha: new Date().toISOString()
    });
    
    // Mostrar mensaje de éxito
    mostrarMensajeExito(username, nombre, rol);
    
    // Ocultar loading
    mostrarLoading(false);
    
    // Limpiar formulario
    document.getElementById('registerForm').reset();
    document.getElementById('username-preview').style.display = 'none';
    
    // Redirigir después de 3 segundos
    setTimeout(() => {
        window.location.href = 'vis_inicioSesion.html';
    }, 3000);
}

// Mostrar mensaje de éxito
function mostrarMensajeExito(username, nombre, rol) {
    const mensaje = `
        ✅ REGISTRO EXITOSO
        
        👤 Nombre: ${nombre}
        🆔 Username: ${username}
        🎯 Rol: ${rol === 'admin' ? 'Administrador' : 'Técnico'}
        
        ⚠️ IMPORTANTE:
        Guarda tu username para iniciar sesión.
        Serás redirigido al login en 3 segundos...
    `;
    
    alert(mensaje.replace(/\n\n/g, '\n'));
}