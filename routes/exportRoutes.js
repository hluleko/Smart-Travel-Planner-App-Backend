const express = require("express");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const { stringify } = require("csv-stringify/sync");

module.exports = function (db) {
  const router = express.Router();
  // Excel export
  router.get("/export/:table/excel", async (req, res) => {
    const tableName = req.params.table;
    console.log(`Excel export requested for table: ${tableName}`);

    // Validate allowed tables
    const allowedTables = ['user', 'trip', 'destination', 'cost', 'admin', 'alert', 'stop'];
    if (!allowedTables.includes(tableName)) {
      return res.status(400).json({ error: 'Invalid table name.' });
    }

    try {
      db.query(`SELECT * FROM \`${tableName}\``, async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        // Set CORS headers to allow download
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
        
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(tableName);

        if (results.length > 0) {
          worksheet.columns = Object.keys(results[0]).map(key => ({
            header: key,
            key: key,
          }));

          results.forEach(row => worksheet.addRow(row));
        }

        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
          'Content-Disposition',
          `attachment; filename=${tableName}.xlsx`
        );

        await workbook.xlsx.write(res);
        res.end();
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  // PDF export
  router.get("/export/:table/pdf", async (req, res) => {
    const tableName = req.params.table;

    // Validate allowed tables
    const allowedTables = ['user', 'trip', 'destination', 'cost', 'admin', 'alert', 'stop'];
    if (!allowedTables.includes(tableName)) {
      return res.status(400).json({ error: 'Invalid table name.' });
    }

    try {
      db.query(`SELECT * FROM \`${tableName}\``, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        // Set CORS headers to allow download
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
        
        // Create a PDF document
        const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
        
        // Set response headers for PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${tableName}.pdf`);
        
        // Pipe the PDF document to the response
        doc.pipe(res);
        
        // Add title to the PDF
        doc.fontSize(20).text(`${tableName.toUpperCase()} Data`, { align: 'center' });
        doc.moveDown();
        
        if (results.length > 0) {
          const headers = Object.keys(results[0]);
          
          // Calculate column widths
          const pageWidth = doc.page.width - 2 * doc.page.margins.left;
          const columnWidth = pageWidth / headers.length;
          
          // Draw headers
          doc.fontSize(12);
          doc.font('Helvetica-Bold');
          
          let xPos = doc.page.margins.left;
          headers.forEach(header => {
            doc.text(header, xPos, doc.y, { width: columnWidth, align: 'left' });
            xPos += columnWidth;
          });
          
          doc.moveDown();
          doc.font('Helvetica');
          
          // Draw rows
          results.forEach((row, rowIndex) => {
            // Check if we're near the bottom of the page
            if (doc.y > doc.page.height - 100) {
              doc.addPage();
            }
            
            xPos = doc.page.margins.left;
            const yPos = doc.y;
            
            headers.forEach(header => {
              const cellValue = row[header] !== null ? String(row[header]) : '';
              doc.text(cellValue.substring(0, 30), xPos, yPos, { width: columnWidth, align: 'left' });
              xPos += columnWidth;
            });
            
            doc.moveDown();
          });
        } else {
          doc.text('No data available', { align: 'center' });
        }
        
        // Finalize the PDF
        doc.end();
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
    // CSV export
  router.get("/export/:table/csv", async (req, res) => {
    const tableName = req.params.table;

    // Validate allowed tables
    const allowedTables = ['user', 'trip', 'destination', 'cost', 'admin', 'alert', 'stop'];
    if (!allowedTables.includes(tableName)) {
      return res.status(400).json({ error: 'Invalid table name.' });
    }

    try {
      db.query(`SELECT * FROM \`${tableName}\``, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Set CORS headers to allow download
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
        
        // Set response headers for CSV
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${tableName}.csv`);
        if (results.length > 0) {
          // Convert results to CSV
          const headers = Object.keys(results[0]);
          const csvData = stringify(results, { header: true, columns: headers });
          
          // Send the CSV data
          res.send(csvData);
        } else {
          // Send empty CSV with headers if no data
          res.send('');
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // For backwards compatibility - redirects to Excel export
  router.get("/export/:table", (req, res) => {
    const tableName = req.params.table;
    res.redirect(`/api/export/${tableName}/excel`);
  });
  router.get("/preview/:table", async (req, res) => {
    const tableName = req.params.table;
    const allowedTables = ['user', 'trip', 'destination', 'cost', 'admin', 'alert', 'stop'];
    if (!allowedTables.includes(tableName)) {
      return res.status(400).json({ error: 'Invalid table name.' });
    }

    try {
      db.query(`SELECT * FROM \`${tableName}\` LIMIT 10`, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
