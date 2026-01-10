<?php
// tickets_api.php
// API para manejar tickets - conecta el frontend con la base de datos

require_once 'conexion.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

class TicketsAPI {
    private $conn;
    
    public function __construct() {
        $conexion = new ConexionDB();
        $this->conn = $conexion->conectar();
    }
    
    // Método para crear un nuevo ticket desde el formulario HTML
    public function crearTicket($datos) {
        try {
            // Generar ID del ticket
            $ticket_id = $this->generarTicketId();
            
            // Preparar la consulta
            $sql = "INSERT INTO tickets (
                ticket_id, 
                nombre_completo, 
                departamento, 
                asunto, 
                estado
            ) VALUES (
                :ticket_id, 
                :nombre_completo, 
                :departamento, 
                :asunto, 
                'Abierto'
            )";
            
            $stmt = $this->conn->prepare($sql);
            
            // Ejecutar con los datos
            $resultado = $stmt->execute([
                ':ticket_id' => $ticket_id,
                ':nombre_completo' => $datos['nombre'] ?? '',
                ':departamento' => $datos['departamento'] ?? '',
                ':asunto' => $datos['asunto'] ?? ''
            ]);
            
            if ($resultado) {
                return [
                    'success' => true,
                    'message' => 'Ticket creado exitosamente',
                    'ticket_id' => $ticket_id,
                    'data' => [
                        'id' => $ticket_id,
                        'asunto' => $datos['asunto'] ?? '',
                        'prioridad' => '',
                        'fecha' => date('d/m/Y'),
                        'estado' => 'Abierto',
                        'tecnico' => ''
                    ]
                ];
            } else {
                return ['success' => false, 'message' => 'Error al crear ticket'];
            }
            
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Error en la base de datos: ' . $e->getMessage()];
        }
    }
    
    // Obtener todos los tickets para el admin
    public function obtenerTicketsAdmin() {
        try {
            $sql = "SELECT 
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
                    fecha DESC";
            
            $stmt = $this->conn->query($sql);
            $tickets = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return ['success' => true, 'tickets' => $tickets];
            
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Error al obtener tickets: ' . $e->getMessage()];
        }
    }
    
    // Obtener tickets asignados a un técnico específico
    public function obtenerTicketsTecnico($tecnico_nombre) {
        try {
            $sql = "SELECT 
                ticket_id as id,
                asunto,
                prioridad,
                TO_CHAR(fecha, 'DD/MM/YYYY') as fecha,
                estado,
                tecnico,
                nombre_completo,
                departamento
                FROM tickets 
                WHERE tecnico = :tecnico
                ORDER BY 
                    CASE 
                        WHEN prioridad = 'alta' THEN 1
                        WHEN prioridad = 'media' THEN 2
                        WHEN prioridad = 'baja' THEN 3
                        ELSE 4
                    END,
                    fecha DESC";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([':tecnico' => $tecnico_nombre]);
            $tickets = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return ['success' => true, 'tickets' => $tickets];
            
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Error al obtener tickets: ' . $e->getMessage()];
        }
    }
    
    // Asignar técnico y prioridad a un ticket
    public function asignarTicket($ticket_id, $prioridad, $tecnico_codigo) {
        try {
            // Obtener nombre del técnico basado en el código
            $nombre_tecnico = $this->obtenerNombreTecnico($tecnico_codigo);
            
            if (!$nombre_tecnico) {
                return ['success' => false, 'message' => 'Técnico no encontrado'];
            }
            
            $sql = "UPDATE tickets 
                    SET prioridad = :prioridad, 
                        tecnico = :tecnico,
                        estado = 'Activo'
                    WHERE ticket_id = :ticket_id
                    RETURNING *";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([
                ':prioridad' => $prioridad,
                ':tecnico' => $nombre_tecnico,
                ':ticket_id' => $ticket_id
            ]);
            
            $ticketActualizado = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($ticketActualizado) {
                return [
                    'success' => true,
                    'message' => 'Ticket asignado correctamente',
                    'ticket' => [
                        'id' => $ticketActualizado['ticket_id'],
                        'prioridad' => $ticketActualizado['prioridad'],
                        'tecnico' => $ticketActualizado['tecnico'],
                        'estado' => $ticketActualizado['estado']
                    ]
                ];
            } else {
                return ['success' => false, 'message' => 'Ticket no encontrado'];
            }
            
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Error al asignar ticket: ' . $e->getMessage()];
        }
    }
    
    // Actualizar estado de un ticket (para técnicos)
    public function actualizarEstado($ticket_id, $nuevo_estado, $tecnico_nombre = null) {
        try {
            $sql = "UPDATE tickets SET estado = :estado WHERE ticket_id = :ticket_id";
            
            // Si se proporciona nombre de técnico, verificar que es el asignado
            if ($tecnico_nombre) {
                $sql .= " AND tecnico = :tecnico";
            }
            
            $sql .= " RETURNING *";
            
            $stmt = $this->conn->prepare($sql);
            
            $params = [
                ':estado' => $nuevo_estado,
                ':ticket_id' => $ticket_id
            ];
            
            if ($tecnico_nombre) {
                $params[':tecnico'] = $tecnico_nombre;
            }
            
            $stmt->execute($params);
            
            $ticketActualizado = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($ticketActualizado) {
                return [
                    'success' => true,
                    'message' => 'Estado actualizado correctamente',
                    'ticket' => $ticketActualizado
                ];
            } else {
                return ['success' => false, 'message' => 'Ticket no encontrado o no tienes permisos'];
            }
            
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Error al actualizar estado: ' . $e->getMessage()];
        }
    }
    
    // Tomar un ticket (cambiar a "En proceso")
    public function tomarTicket($ticket_id, $tecnico_nombre) {
        return $this->actualizarEstado($ticket_id, 'En proceso', $tecnico_nombre);
    }
    
    // Eliminar un ticket
    public function eliminarTicket($ticket_id) {
        try {
            $sql = "DELETE FROM tickets WHERE ticket_id = :ticket_id";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([':ticket_id' => $ticket_id]);
            
            if ($stmt->rowCount() > 0) {
                return ['success' => true, 'message' => 'Ticket eliminado correctamente'];
            } else {
                return ['success' => false, 'message' => 'Ticket no encontrado'];
            }
            
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Error al eliminar ticket: ' . $e->getMessage()];
        }
    }
    
    // Obtener un ticket específico
    public function obtenerTicket($ticket_id) {
        try {
            $sql = "SELECT * FROM tickets WHERE ticket_id = :ticket_id";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([':ticket_id' => $ticket_id]);
            
            $ticket = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($ticket) {
                return [
                    'success' => true,
                    'ticket' => [
                        'id' => $ticket['ticket_id'],
                        'asunto' => $ticket['asunto'],
                        'nombre_completo' => $ticket['nombre_completo'],
                        'departamento' => $ticket['departamento'],
                        'prioridad' => $ticket['prioridad'],
                        'fecha' => $ticket['fecha'],
                        'estado' => $ticket['estado'],
                        'tecnico' => $ticket['tecnico']
                    ]
                ];
            } else {
                return ['success' => false, 'message' => 'Ticket no encontrado'];
            }
            
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Error al obtener ticket: ' . $e->getMessage()];
        }
    }
    
    // Obtener lista de técnicos activos
    public function obtenerTecnicos() {
        try {
            $sql = "SELECT id, nombre FROM usuarios WHERE rol = 'tecnico' AND activo = true ORDER BY nombre";
            
            $stmt = $this->conn->query($sql);
            $tecnicos = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return ['success' => true, 'tecnicos' => $tecnicos];
            
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Error al obtener técnicos: ' . $e->getMessage()];
        }
    }
    
    // Obtener nombre del técnico por código
    private function obtenerNombreTecnico($codigo) {
        try {
            // Si es un número, buscar por ID
            if (is_numeric($codigo)) {
                $sql = "SELECT nombre FROM usuarios WHERE id = :id AND rol = 'tecnico'";
                $stmt = $this->conn->prepare($sql);
                $stmt->execute([':id' => $codigo]);
                $tecnico = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($tecnico) {
                    return $tecnico['nombre'];
                }
            }
            
            // Si no es número, asumir que ya es el nombre
            return $codigo;
            
        } catch (PDOException $e) {
            return null;
        }
    }
    
    // Generar ID único para el ticket
    private function generarTicketId() {
        $prefix = 'TCK-' . date('Y') . '-';
        
        try {
            // Obtener el último número secuencial
            $sql = "SELECT COUNT(*) as total FROM tickets WHERE ticket_id LIKE ?";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([$prefix . '%']);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $numero = $result['total'] + 1;
            return $prefix . str_pad($numero, 4, '0', STR_PAD_LEFT);
            
        } catch (PDOException $e) {
            // Si hay error, usar timestamp
            return $prefix . date('His');
        }
    }
    
    public function __destruct() {
        $this->conn = null;
    }
}

// Manejar las solicitudes
session_start();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $api = new TicketsAPI();
    $accion = $_POST['accion'] ?? '';
    
    switch ($accion) {
        case 'crear':
            // Crear nuevo ticket desde el formulario principal
            $datos = [
                'nombre' => $_POST['nombre'] ?? '',
                'departamento' => $_POST['departamento'] ?? '',
                'asunto' => $_POST['asunto'] ?? ''
            ];
            echo json_encode($api->crearTicket($datos));
            break;
            
        case 'obtener_admin':
            // Obtener todos los tickets para el admin
            echo json_encode($api->obtenerTicketsAdmin());
            break;
            
        case 'obtener_tecnico':
            // Obtener tickets del técnico actual
            $tecnico_nombre = $_POST['tecnico'] ?? $_SESSION['usuario_nombre'] ?? '';
            echo json_encode($api->obtenerTicketsTecnico($tecnico_nombre));
            break;
            
        case 'asignar':
            // Asignar técnico y prioridad
            if (isset($_POST['ticket_id'], $_POST['prioridad'], $_POST['tecnico'])) {
                echo json_encode($api->asignarTicket(
                    $_POST['ticket_id'],
                    $_POST['prioridad'],
                    $_POST['tecnico']
                ));
            } else {
                echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
            }
            break;
            
        case 'cambiar_estado':
            // Cambiar estado del ticket (para técnicos)
            if (isset($_POST['ticket_id'], $_POST['estado'])) {
                $tecnico_nombre = $_POST['tecnico'] ?? $_SESSION['usuario_nombre'] ?? null;
                echo json_encode($api->actualizarEstado(
                    $_POST['ticket_id'],
                    $_POST['estado'],
                    $tecnico_nombre
                ));
            } else {
                echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
            }
            break;
            
        case 'tomar_ticket':
            // Tomar un ticket
            if (isset($_POST['ticket_id'], $_POST['tecnico'])) {
                echo json_encode($api->tomarTicket(
                    $_POST['ticket_id'],
                    $_POST['tecnico']
                ));
            } else {
                echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
            }
            break;
            
        case 'eliminar':
            // Eliminar ticket
            if (isset($_POST['ticket_id'])) {
                echo json_encode($api->eliminarTicket($_POST['ticket_id']));
            } else {
                echo json_encode(['success' => false, 'message' => 'ID de ticket no proporcionado']);
            }
            break;
            
        case 'obtener':
            // Obtener un ticket específico
            if (isset($_POST['ticket_id'])) {
                echo json_encode($api->obtenerTicket($_POST['ticket_id']));
            } else {
                echo json_encode(['success' => false, 'message' => 'ID de ticket no proporcionado']);
            }
            break;
            
        case 'obtener_tecnicos':
            // Obtener lista de técnicos
            echo json_encode($api->obtenerTecnicos());
            break;
            
        case 'login':
            // Autenticar usuario
            if (isset($_POST['username'], $_POST['password'])) {
                $resultado = autenticarUsuario($_POST['username'], $_POST['password']);
                
                if ($resultado['success']) {
                    $_SESSION['usuario_id'] = $resultado['usuario']['id'];
                    $_SESSION['usuario_nombre'] = $resultado['usuario']['nombre'];
                    $_SESSION['usuario_rol'] = $resultado['usuario']['rol'];
                    $_SESSION['logged_in'] = true;
                }
                
                echo json_encode($resultado);
            } else {
                echo json_encode(['success' => false, 'message' => 'Usuario y contraseña requeridos']);
            }
            break;
            
        case 'logout':
            // Cerrar sesión
            session_destroy();
            echo json_encode(['success' => true, 'message' => 'Sesión cerrada']);
            break;
            
        default:
            echo json_encode(['success' => false, 'message' => 'Acción no válida']);
    }
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['inicializar'])) {
        $resultado = inicializarBaseDatos();
        echo json_encode($resultado);
    } else {
        echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    }
}
?>