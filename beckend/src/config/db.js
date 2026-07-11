const mysql = require('mysql2/promise');
const config = require('./env');

const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.name,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true,
});

/**
 * Runs `fn` inside a MySQL transaction on a dedicated connection.
 * Commits on success, rolls back on any thrown error, and always
 * releases the connection back to the pool.
 *
 * Usage:
 *   await withTransaction(async (conn) => {
 *     await conn.query('UPDATE ...');
 *     await conn.query('INSERT ...');
 *   });
 */
async function withTransaction(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    try {
      await conn.rollback();
    } catch (_) {
      // ignore rollback errors, the original error is what matters
    }
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { pool, withTransaction };
