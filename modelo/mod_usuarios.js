const { pool } = require('../modelo/conexion')

class Usuario {
    static async registrar(datos) {
        try {
            const { cedula, name, rol, authCode } = datos;
            const username = this.generarUsername(name, cedula)

            const sql = `INSERT INTO usuarios (
                username, 
                nombre, 
                rol,
                authCode
            ) VALUES ($1, $2, $3, $4)
            RETURNING *`;

            const values = [username, name, rol, authCode];

            const result = await pool.query(sql, values);

            if (result.rowCount > 0) {
                const usuario = result.rows[0];
                return { success: true, usuario: usuario, message: 'Usuario creado exitosamente' };
            }

            return { success: false, message: 'No se pudo crear el usuario' };

        } catch (error) {
            if (error.code === '23505') {
                return { success: false, message: `El username "${datos.username}" ya está registrado` };
            }

            console.error('Error en modelo Usuario.registrar:', error);
            return { success: false, message: 'Error en la base de datos: ' + error.message };
        }

    }

    static async autenticar(username) {

        try {
            const sql = `SELECT 
            id,
            username,
            nombre,
            rol,
            activo,
            created_at
            FROM usuarios 
            WHERE username = $1`;

            const result = await pool.query(sql, [username]);

            if (result.rowCount > 0) {
                return { success: true, usuario: result.rows[0], message: 'Usuario encontrado' };
            }

            return { success: false, message: `Usuario "${username}" no encontrado`, usuario: null };

        } catch (error) {
            console.error('Error en modelo Usuario.autenticar:', error);
            return { success: false, message: 'Error en la búsqueda: ' + error.message };
        }
    }

    static generarUsername(nombreCompleto, cedula) {
        const primerNombre = nombreCompleto.split(" ")[0].toLowerCase();
        const primerasTresLetras = primerNombre.substring(0, 3);
        const ultimosCuatroDigitos = cedula.slice(-4);
        return primerasTresLetras + ultimosCuatroDigitos;
    }

}

module.exports = Usuario