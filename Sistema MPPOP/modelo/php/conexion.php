<?php
// conexion.php
// Conexión a PostgreSQL para el sistema MPPOP

class ConexionDB {
    private $host = "127.0.0.1";
    private $port = "5432";
    private $dbname = "mppop_tickets";
    private $user = "postgres";
    private $password = "NMG123456"; // Cambia esto por tu contraseña
    private $conn;
    
    public function conectar() {
        try {
            $dsn = "pgsql:host={$this->host};port={$this->port};dbname={$this->dbname}";
            $this->conn = new PDO($dsn, $this->user, $this->password);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->exec("SET NAMES 'UTF8'");
            return $this->conn;
        } catch (PDOException $e) {
            die(json_encode(['success' => false, 'message' => 'Error de conexión: ' . $e->getMessage()]));
        }
    }
    
    public function desconectar() {
        $this->conn = null;
    }
}

// Función para inicializar la base de datos y crear tablas
function inicializarBaseDatos() {
    $conexion = new ConexionDB();
    $conn = $conexion->conectar();
    
    try {
        // Crear tabla de tickets
        $sql = "CREATE TABLE IF NOT EXISTS tickets (
            id SERIAL PRIMARY KEY,
            ticket_id VARCHAR(20) UNIQUE NOT NULL,
            nombre_completo VARCHAR(100) NOT NULL,
            departamento VARCHAR(100) NOT NULL,
            asunto VARCHAR(200) NOT NULL,
            prioridad VARCHAR(20) DEFAULT '',
            fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            estado VARCHAR(20) DEFAULT 'Abierto',
            tecnico VARCHAR(100) DEFAULT '',
            email VARCHAR(100),
            telefono VARCHAR(20),
            descripcion TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )";
        
        $conn->exec($sql);
        
        // Crear tabla de usuarios (técnicos y admin)
        $sqlUsuarios = "CREATE TABLE IF NOT EXISTS usuarios (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            nombre VARCHAR(100) NOT NULL,
            rol VARCHAR(20) NOT NULL, -- 'admin', 'tecnico', 'usuario'
            activo BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )";
        
        $conn->exec($sqlUsuarios);
        
        // Insertar usuarios por defecto si la tabla está vacía
        $stmt = $conn->query("SELECT COUNT(*) as count FROM usuarios");
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result['count'] == 0) {
            $usuarios = [
                ['username' => 'admin', 'password' => password_hash('admin123', PASSWORD_DEFAULT), 'nombre' => 'Administrador', 'rol' => 'admin'],
                ['username' => 'jperez', 'password' => password_hash('tecnico123', PASSWORD_DEFAULT), 'nombre' => 'Juan Pérez', 'rol' => 'tecnico'],
                ['username' => 'mgonzalez', 'password' => password_hash('tecnico123', PASSWORD_DEFAULT), 'nombre' => 'María González', 'rol' => 'tecnico']
            ];
            
            $insertStmt = $conn->prepare("INSERT INTO usuarios (username, password, nombre, rol) VALUES (?, ?, ?, ?)");
            foreach ($usuarios as $usuario) {
                $insertStmt->execute([$usuario['username'], $usuario['password'], $usuario['nombre'], $usuario['rol']]);
            }
        }
        
        // Insertar algunos tickets de ejemplo
        $stmt = $conn->query("SELECT COUNT(*) as count FROM tickets");
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result['count'] == 0) {
            $ticketsEjemplo = [
                [
                    'ticket_id' => 'TCK-2024-0001',
                    'nombre_completo' => 'Carlos Rodríguez',
                    'departamento' => 'Tecnología de la Información y Comunicación',
                    'asunto' => 'Error en sistema',
                    'prioridad' => 'alta',
                    'estado' => 'Activo',
                    'tecnico' => 'Juan Pérez'
                ],
                [
                    'ticket_id' => 'TCK-2024-0002',
                    'nombre_completo' => 'Ana Martínez',
                    'departamento' => 'Recursos Humanos',
                    'asunto' => 'Solicitud acceso',
                    'prioridad' => 'media',
                    'estado' => 'En proceso',
                    'tecnico' => 'Juan Pérez'
                ]
            ];
            
            $insertTicket = $conn->prepare("INSERT INTO tickets (ticket_id, nombre_completo, departamento, asunto, prioridad, estado, tecnico, fecha) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())");
            foreach ($ticketsEjemplo as $ticket) {
                $insertTicket->execute([
                    $ticket['ticket_id'],
                    $ticket['nombre_completo'],
                    $ticket['departamento'],
                    $ticket['asunto'],
                    $ticket['prioridad'],
                    $ticket['estado'],
                    $ticket['tecnico']
                ]);
            }
        }
        
        $conexion->desconectar();
        return ['success' => true, 'message' => 'Base de datos inicializada correctamente'];
        
    } catch (PDOException $e) {
        return ['success' => false, 'message' => 'Error al inicializar: ' . $e->getMessage()];
    }
}

// Función para autenticar usuarios
function autenticarUsuario($username, $password) {
    $conexion = new ConexionDB();
    $conn = $conexion->conectar();
    
    try {
        $sql = "SELECT id, username, password, nombre, rol FROM usuarios WHERE username = ? AND activo = true";
        $stmt = $conn->prepare($sql);
        $stmt->execute([$username]);
        $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $conexion->desconectar();
        
        if ($usuario && password_verify($password, $usuario['password'])) {
            return [
                'success' => true,
                'usuario' => [
                    'id' => $usuario['id'],
                    'username' => $usuario['username'],
                    'nombre' => $usuario['nombre'],
                    'rol' => $usuario['rol']
                ]
            ];
        } else {
            return ['success' => false, 'message' => 'Usuario o contraseña incorrectos'];
        }
        
    } catch (PDOException $e) {
        return ['success' => false, 'message' => 'Error de autenticación: ' . $e->getMessage()];
    }
}
?>