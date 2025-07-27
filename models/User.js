const { pool } = require('../config/database');

class User {
  static async findById(id) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  static async create(userData) {
    const { name, email, password, phone, role, businessName, address } = userData;
    const query = `
      INSERT INTO users (name, email, password, phone, role, business_name, address)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [name, email, password, phone, role, businessName, address];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async update(id, updates) {
    const fields = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`);
    const query = `
      UPDATE users 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const values = [id, ...Object.values(updates)];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM users WHERE id = $1';
    await pool.query(query, [id]);
  }

  static async getByRole(role) {
    const query = 'SELECT * FROM users WHERE role = $1 ORDER BY created_at DESC';
    const result = await pool.query(query, [role]);
    return result.rows;
  }
}

module.exports = User;
