const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'webshopdb'
});

connection.connect(err => {
  if (err) {
    console.error('MySQL kapcsolódási hiba:', err);
    return;
  }
  console.log('Csatlakozva a MySQL adatbázishoz.');
});

module.exports = connection;
