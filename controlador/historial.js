

const { pool } = require('../modelo/conexion');

// Para mostrar tickets con estado "finalizado"
const mostrarFinalizados = async (req, res) => {
	try {
		const sql = `SELECT 
			ticket_id AS id,
			asunto,
			prioridad,
			TO_CHAR(fecha, 'DD/MM/YYYY') AS fecha,
			estado,
			tecnico,
			nombre_completo,
			departamento
			FROM tickets
			WHERE LOWER(estado) = 'finalizado'
			ORDER BY fecha DESC`;

		const result = await pool.query(sql);

		return res.status(200).json({ success: true, tickets: result.rows });
	} catch (error) {
		console.error('Error en mostrarFinalizados:', error);
		return res.status(500).json({ success: false, message: error.message });
	}
};

// Para generar descarga de tickets finalizados en PDF o Excel (CSV)
const generarDescarga = async (req, res) => {
	try {
		const format = (req.query.format || 'pdf').toLowerCase();

		const sql = `SELECT 
			ticket_id AS id,
			asunto,
			prioridad,
			TO_CHAR(fecha, 'DD/MM/YYYY') AS fecha,
			estado,
			tecnico,
			nombre_completo,
			departamento
			FROM tickets
			WHERE LOWER(estado) = 'finalizado'
			ORDER BY fecha DESC`;

		const result = await pool.query(sql);
		const rows = result.rows || [];

		if (format === 'excel') {
			// Generar CSV (Excel puede abrirlo)
			const headers = ['id','asunto','prioridad','fecha','estado','tecnico','nombre_completo','departamento'];
			// Agregar BOM para mejorar compatibilidad con Excel
			let csv = '\uFEFF' + headers.join(',') + '\r\n';

			for (const r of rows) {
				const values = headers.map(h => {
					const v = r[h] == null ? '' : String(r[h]);
					// escapar comillas dobles
					return '"' + v.replace(/"/g, '""') + '"';
				});
				csv += values.join(',') + '\r\n';
			}

			res.setHeader('Content-Type', 'text/csv; charset=utf-8');
			res.setHeader('Content-Disposition', 'attachment; filename="tickets_finalizados.csv"');
			return res.send(csv);
		}

		// Por defecto: PDF
		let PDFDocument;
		try {
			PDFDocument = require('pdfkit');
		} catch (e) {
			return res.status(500).json({ success: false, message: 'Dependencia faltante: instale pdfkit (npm install pdfkit)' });
		}

		const doc = new PDFDocument({ margin: 40, size: 'A4' });
		res.setHeader('Content-Type', 'application/pdf');
		res.setHeader('Content-Disposition', 'attachment; filename="tickets_finalizados.pdf"');
		doc.pipe(res);

		doc.fontSize(16).text('Tickets Finalizados', { align: 'center' });
		doc.moveDown(1);

		// Definir columnas (posiciones)
		const startX = doc.page.margins.left;
		const tableTop = doc.y;
		const columnWidths = [40, 140, 60, 70, 60, 80, 120, 80];
		const columns = ['ID','Asunto','Prioridad','Fecha','Estado','Técnico','Nombre','Departamento'];

		// Cabecera
		let x = startX;
		doc.fontSize(9).font('Helvetica-Bold');
		for (let i = 0; i < columns.length; i++) {
			doc.text(columns[i], x, tableTop, { width: columnWidths[i], continued: false });
			x += columnWidths[i];
		}

		let y = tableTop + 18;
		doc.font('Helvetica').fontSize(9);

		for (const r of rows) {
			x = startX;
			const values = [r.id, r.asunto, r.prioridad, r.fecha, r.estado, r.tecnico, r.nombre_completo, r.departamento];

			// Si se acerca al final de la página, agregar nueva página
			if (y > doc.page.height - doc.page.margins.bottom - 30) {
				doc.addPage();
				y = doc.page.margins.top;
			}

			for (let i = 0; i < values.length; i++) {
				const text = values[i] == null ? '' : String(values[i]);
				doc.text(text, x, y, { width: columnWidths[i], continued: false });
				x += columnWidths[i];
			}

			y += 16;
		}

		doc.end();
	} catch (error) {
		console.error('Error en generarDescarga:', error);
		return res.status(500).json({ success: false, message: error.message });
	}
};

module.exports = { mostrarFinalizados, generarDescarga };

