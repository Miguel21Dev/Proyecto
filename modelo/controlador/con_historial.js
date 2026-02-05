const { pool } = require('../modelo/conexion');

// Función auxiliar: convierte nombre de mes (Español) a número 1-12
const mesNombreANumero = (mes) => {
	if (!mes) return null;
	const m = mes.toString().trim().toLowerCase();
	const map = {
		'enero': 1,
		'febrero': 2,
		'marzo': 3,
		'abril': 4,
		'mayo': 5,
		'junio': 6,
		'julio': 7,
		'agosto': 8,
		'septiembre': 9,
		'setiembre': 9,
		'octubre': 10,
		'noviembre': 11,
		'diciembre': 12
	};
	if (map[m]) return map[m];
	const asNum = parseInt(mes, 10);
	return isNaN(asNum) ? null : asNum;
};

// Para mostrar tickets con estado "finalizado"
const mostrarFinalizados = async (req, res) => {
	try {
		const { mes, anio } = req.query || {};

		let sql = `SELECT 
			t.id,
			t.asunto,
			t.prioridad,
			TO_CHAR(t.fecha, 'DD/MM/YYYY') AS fecha,
			t.estado,
			u.nombre as tecnico,
			t.nombre_completo,
			t.departamento
			FROM tickets t
			LEFT JOIN usuarios u ON t.tecnico = u.id::text`;

		const filters = [`LOWER(t.estado) = 'finalizado'`];
		const values = [];
		if (mes && anio) {
			const mesNum = mesNombreANumero(mes);
			const anioNum = parseInt(anio, 10);
			if (mesNum && anioNum) {
				filters.push('EXTRACT(MONTH FROM t.fecha) = $1');
				filters.push('EXTRACT(YEAR FROM t.fecha) = $2');
				values.push(mesNum, anioNum);
			}
		}

		if (filters.length > 0) sql += '\n WHERE ' + filters.join(' AND ');
		sql += '\n ORDER BY t.fecha DESC';

		const result = await pool.query(sql, values);

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
		const { mes, anio } = req.query || {};

		let sql = `SELECT 
			t.id,
			t.asunto,
			t.prioridad,
			TO_CHAR(t.fecha, 'DD/MM/YYYY') AS fecha,
			t.estado,
			u.nombre as tecnico,
			t.nombre_completo,
			t.departamento
			FROM tickets t
			LEFT JOIN usuarios u ON t.tecnico = u.id::text`;

		const filters = [`LOWER(t.estado) = 'finalizado'`];
		const values = [];
		if (mes && anio) {
			const mesNum = mesNombreANumero(mes);
			const anioNum = parseInt(anio, 10);
			if (mesNum && anioNum) {
				filters.push('EXTRACT(MONTH FROM t.fecha) = $1');
				filters.push('EXTRACT(YEAR FROM t.fecha) = $2');
				values.push(mesNum, anioNum);
			}
		}

		if (filters.length > 0) sql += '\n WHERE ' + filters.join(' AND ');
		sql += '\n ORDER BY t.fecha DESC';

		const result = await pool.query(sql, values);
		const rows = result.rows || [];

		if (format === 'excel') {
			const headers = ['id','asunto','prioridad','fecha','estado','tecnico','nombre_completo','departamento'];
			let csv = '\uFEFF' + headers.join(',') + '\r\n';
			for (const r of rows) {
				const valuesRow = headers.map(h => {
					const v = r[h] == null ? '' : String(r[h]);
					return '"' + v.replace(/"/g, '""') + '"';
				});
				csv += valuesRow.join(',') + '\r\n';
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

		const startX = doc.page.margins.left;
		const tableTop = doc.y;
		// Anchos de columnas (la suma debe ajustarse a la página); dibujamos cada columna
		// dejando un pequeño espacio a la derecha para separación visual
		const columnWidths = [40, 145, 60, 70, 60, 80, 120, 80];
		const columns = ['ID','Asunto','Prioridad','Fecha','Estado','Técnico','Nombre','Departamento'];
		const gap = 6; // pequeño espacio entre columnas en el PDF

		let x = startX;
		doc.fontSize(9).font('Helvetica-Bold');
		for (let i = 0; i < columns.length; i++) {
			// restar `gap` al ancho de dibujo para dejar un pequeño espacio a la derecha
			const w = Math.max(10, columnWidths[i] - gap);
			doc.text(columns[i], x, tableTop, { width: w, continued: false });
			x += columnWidths[i];
		}

		let y = tableTop + 18;
		doc.font('Helvetica').fontSize(9);
		const rowHeight = 12; // altura aproximada de la fila para fontSize 9
		const rowGap = 4; // pequeño espacio vertical entre filas

		for (const r of rows) {
			x = startX;
			const vals = [r.id, r.asunto, r.prioridad, r.fecha, r.estado, r.tecnico, r.nombre_completo, r.departamento];
			// comprobar si la siguiente fila cabe, teniendo en cuenta el espacio vertical
			if (y > doc.page.height - doc.page.margins.bottom - (rowHeight + rowGap)) {
				doc.addPage();
				y = doc.page.margins.top;
				// redraw header on new page
				x = startX;
				doc.fontSize(9).font('Helvetica-Bold');
				for (let i = 0; i < columns.length; i++) {
					const w = Math.max(10, columnWidths[i] - gap);
					doc.text(columns[i], x, y, { width: w, continued: false });
					x += columnWidths[i];
				}
				y += 18; // space after header
				doc.font('Helvetica').fontSize(9);
			}
			for (let i = 0; i < vals.length; i++) {
				const text = vals[i] == null ? '' : String(vals[i]);
				const w = Math.max(10, columnWidths[i] - gap);
				doc.text(text, x, y, { width: w, continued: false });
				x += columnWidths[i];
			}
			y += rowHeight + rowGap;
		}

		doc.end();
	} catch (error) {
		console.error('Error en generarDescarga:', error);
		return res.status(500).json({ success: false, message: error.message });
	}
};

module.exports = { mostrarFinalizados, generarDescarga };

