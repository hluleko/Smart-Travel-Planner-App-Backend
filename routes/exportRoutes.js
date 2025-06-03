const express = require("express");
const ExcelJS = require("exceljs");

module.exports = function (db) {
  const router = express.Router();

  router.get("/export/:table", async (req, res) => {
    const tableName = req.params.table;

    // Validate allowed tables
    const allowedTables = ['user', 'trip', 'destination', 'budget', 'admin', 'alert', 'allergy'];
    if (!allowedTables.includes(tableName)) {
      return res.status(400).json({ error: 'Invalid table name.' });
    }

    try {
      db.query(`SELECT * FROM \`${tableName}\``, async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

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


  router.get("/preview/:table", async (req, res) => {
      const tableName = req.params.table;
      const allowedTables = ['user', 'trip', 'destination', 'budget', 'admin', 'alert', 'allergy'];
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
