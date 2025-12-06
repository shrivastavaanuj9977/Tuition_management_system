// db.js
const mysql = require('mysql2');

// Create a connection pool
const pool = mysql.createPool({
    host: 'localhost',       // your MySQL host
    user: 'root',            // your MySQL username
    password: '9977842647', // your MySQL password
    database: 'tution_db',       // your database name
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Export the pool for queries
module.exports = pool.promise();
