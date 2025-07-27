const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  user: 'post',
  host: 'dpg-d232o463jp1c739fble0-a',
  database: 'vcon',
  password: 'zPBM2PECJFRtCSMfckicC2SSMcgEt0ej', // <-- your real password
  port: 5432,
 
 
});

// Test connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error acquiring client', err.stack);
  } else {
    console.log('Database connected successfully');
    release();
  }
});

module.exports = { pool };
