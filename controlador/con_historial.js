const { pool } = require("../modelo/conexion");

// Función auxiliar: convierte nombre de mes (Español) a número 1-12
const mesNombreANumero = (mes) => {
  if (!mes) return null;
  const m = mes.toString().trim().toLowerCase();
  const map = {
    enero: 1,
    febrero: 2,
    marzo: 3,
    abril: 4,
    mayo: 5,
    junio: 6,
    julio: 7,
    agosto: 8,
    septiembre: 9,
    setiembre: 9,
    octubre: 10,
    noviembre: 11,
    diciembre: 12,
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
        filters.push("EXTRACT(MONTH FROM t.fecha) = $1");
        filters.push("EXTRACT(YEAR FROM t.fecha) = $2");
        values.push(mesNum, anioNum);
      }
    }

    if (filters.length > 0) sql += "\n WHERE " + filters.join(" AND ");
    sql += "\n ORDER BY t.fecha DESC";

    const result = await pool.query(sql, values);

    return res.status(200).json({ success: true, tickets: result.rows });
  } catch (error) {
    console.error("Error en mostrarFinalizados:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Para generar descarga de tickets finalizados en PDF o Excel (CSV)
const generarDescarga = async (req, res) => {
  try {
    const format = (req.query.format || "pdf").toLowerCase();
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
        filters.push("EXTRACT(MONTH FROM t.fecha) = $1");
        filters.push("EXTRACT(YEAR FROM t.fecha) = $2");
        values.push(mesNum, anioNum);
      }
    }

    if (filters.length > 0) sql += "\n WHERE " + filters.join(" AND ");
    sql += "\n ORDER BY t.fecha DESC";

    const result = await pool.query(sql, values);
    const rows = result.rows || [];

    if (format === "excel") {
      const headers = [
        "id",
        "asunto",
        "prioridad",
        "fecha",
        "estado",
        "tecnico",
        "nombre_completo",
        "departamento",
      ];
      let csv = "\uFEFF" + headers.join(",") + "\r\n";
      for (const r of rows) {
        const valuesRow = headers.map((h) => {
          const v = r[h] == null ? "" : String(r[h]);
          return '"' + v.replace(/"/g, '""') + '"';
        });
        csv += valuesRow.join(",") + "\r\n";
      }
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="tickets_finalizados.csv"',
      );
      return res.send(csv);
    }

    // Por defecto: PDF
    // Por defecto: PDF
    let PDFDocument;
    try {
      PDFDocument = require("pdfkit");
    } catch (e) {
      return res
        .status(500)
        .json({
          success: false,
          message: "Dependencia faltante: instale pdfkit (npm install pdfkit)",
        });
    }

    const doc = new PDFDocument({ margin: 40, size: "A4" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="tickets_finalizados.pdf"',
    );
    doc.pipe(res);

    doc.fontSize(16).text("Tickets Finalizados", { align: "center" });
    doc.moveDown(1);

    const startX = doc.page.margins.left;
    const tableTop = doc.y;
    // Anchos de columnas
    const columnWidths = [40, 145, 60, 70, 60, 80, 120, 80];
    const columns = [
      "ID",
      "Asunto",
      "Prioridad",
      "Fecha",
      "Estado",
      "Técnico",
      "Nombre",
      "Departamento",
    ];
    const gap = 6; // pequeño espacio entre columnas en el PDF

    // Configuración de filas
    const fontSize = 9;
    const rowPadding = 4; // padding interno en cada celda
    const rowGap = 2; // espacio entre filas
    const minRowHeight = 14; // altura mínima para cada fila

    // Dibujar encabezados
    let x = startX;
    doc.fontSize(fontSize).font("Helvetica-Bold");
    for (let i = 0; i < columns.length; i++) {
      const w = Math.max(10, columnWidths[i] - gap);
      doc.text(columns[i], x, tableTop, {
        width: w,
        align: "left",
      });
      x += columnWidths[i];
    }

    let y = tableTop + 20; // Espacio después del encabezado
    doc.font("Helvetica").fontSize(fontSize);

    // Función para calcular la altura necesaria para una fila
    function calculateRowHeight(row) {
      const vals = [
        row.id,
        row.asunto,
        row.prioridad,
        row.fecha,
        row.estado,
        row.tecnico,
        row.nombre_completo,
        row.departamento,
      ];

      let maxHeight = minRowHeight;

      // Calcular la altura máxima requerida para cualquier celda en esta fila
      for (let i = 0; i < vals.length; i++) {
        const text = vals[i] == null ? "" : String(vals[i]);
        const w = Math.max(10, columnWidths[i] - gap - 2 * rowPadding);

        // Estimar la altura requerida para el texto
        const textHeight = doc.heightOfString(text, {
          width: w,
          align: "left",
        });

        // Altura total de la celda incluyendo padding
        const cellHeight = textHeight + 2 * rowPadding;
        maxHeight = Math.max(maxHeight, cellHeight);
      }

      return maxHeight;
    }

    for (const row of rows) {
      // Calcular la altura necesaria para esta fila específica
      const rowHeight = calculateRowHeight(row);

      // Verificar si hay suficiente espacio en la página
      if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        y = doc.page.margins.top;

        // Redibujar encabezado en la nueva página
        x = startX;
        doc.fontSize(fontSize).font("Helvetica-Bold");
        for (let i = 0; i < columns.length; i++) {
          const w = Math.max(10, columnWidths[i] - gap);
          doc.text(columns[i], x, y, {
            width: w,
            align: "left",
          });
          x += columnWidths[i];
        }
        y += 20; // Espacio después del encabezado
        doc.font("Helvetica").fontSize(fontSize);
      }

      // Obtener los valores de la fila
      const vals = [
        row.id,
        row.asunto,
        row.prioridad,
        row.fecha,
        row.estado,
        row.tecnico,
        row.nombre_completo,
        row.departamento,
      ];

      x = startX;

      // Dibujar cada celda de la fila
      for (let i = 0; i < vals.length; i++) {
        const text = vals[i] == null ? "" : String(vals[i]);
        const w = Math.max(10, columnWidths[i] - gap);

        // Dibujar el texto con padding
        doc.text(text, x + rowPadding, y + rowPadding, {
          width: w - 2 * rowPadding,
          align: "left",
        });

        // Dibujar borde de la celda (opcional, para mejor visualización)
        doc.rect(x, y, w, rowHeight).stroke();

        x += columnWidths[i];
      }

      // Mover a la siguiente posición vertical
      y += rowHeight + rowGap;
    }

    doc.end();
  } catch (error) {
    console.error("Error en generarDescarga:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { mostrarFinalizados, generarDescarga };
