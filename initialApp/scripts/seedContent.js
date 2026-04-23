/* Seed Content table using SQL file.
 * Usage: node scripts/seedContent.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const mysql = require('mysql');

const sqlPath = path.join(__dirname, '..', 'public', 'archiveContent', 'sqlScripts', 'create_content_table.sql');
const sqlBody = fs.readFileSync(sqlPath, 'utf8');
const sql = `DROP TABLE IF EXISTS Photos;\nDROP TABLE IF EXISTS Content;\n${sqlBody}`;

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  multipleStatements: true,
});

connection.connect((err) => {
  if (err) {
    console.error('Failed to connect to DB:', err.message);
    process.exitCode = 1;
    return;
  }

  connection.query(sql, (queryErr) => {
    if (queryErr) {
      console.error('Seed failed:', queryErr.message);
      process.exitCode = 1;
    } else {
      console.log('Seed completed successfully.');
    }
    connection.end();
  });
});
