const { pool } = require('../config/database');

class Contract {
  static async findById(id) {
    const query = `
      SELECT c.*, u.name as wholesaler_name, u.business_name
      FROM contracts c
      JOIN users u ON c.wholesaler_id = u.id
      WHERE c.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async create(contractData) {
    const { wholesalerId, productName, dailyQuantity, pricePerUnit, duration, description, status } = contractData;
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + duration);
    
    const query = `
      INSERT INTO contracts (wholesaler_id, product_name, daily_quantity, price_per_unit, 
                           duration_days, description, status, end_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const values = [wholesalerId, productName, dailyQuantity, pricePerUnit, duration, description, status, endDate];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async getByWholesaler(wholesalerId) {
    const query = `
      SELECT c.*, 
             COUNT(vc.vendor_id) as accepted_vendors,
             COUNT(o.id) as total_orders
      FROM contracts c
      LEFT JOIN vendor_contracts vc ON c.id = vc.contract_id
      LEFT JOIN orders o ON c.id = o.contract_id
      WHERE c.wholesaler_id = $1
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `;
    const result = await pool.query(query, [wholesalerId]);
    return result.rows;
  }

  static async getAvailableForVendor(vendorId) {
    const query = `
      SELECT c.*, u.name as wholesaler_name, u.business_name
      FROM contracts c
      JOIN users u ON c.wholesaler_id = u.id
      LEFT JOIN vendor_contracts vc ON c.id = vc.contract_id AND vc.vendor_id = $1
      WHERE c.status = 'active' 
        AND c.end_date > CURRENT_DATE
        AND vc.vendor_id IS NULL
      ORDER BY c.created_at DESC
    `;
    const result = await pool.query(query, [vendorId]);
    return result.rows;
  }

  static async getByVendor(vendorId) {
    const query = `
      SELECT c.*, u.name as wholesaler_name, u.business_name, vc.accepted_at
      FROM contracts c
      JOIN users u ON c.wholesaler_id = u.id
      JOIN vendor_contracts vc ON c.id = vc.contract_id
      WHERE vc.vendor_id = $1
      ORDER BY vc.accepted_at DESC
    `;
    const result = await pool.query(query, [vendorId]);
    return result.rows;
  }

  static async getActiveByWholesaler(wholesalerId) {
    const query = `
      SELECT * FROM contracts 
      WHERE wholesaler_id = $1 
        AND status = 'active' 
        AND end_date > CURRENT_DATE
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [wholesalerId]);
    return result.rows;
  }

  static async getEndingSoonByWholesaler(wholesalerId, days = 7) {
    const query = `
      SELECT * FROM contracts 
      WHERE wholesaler_id = $1 
        AND status = 'active' 
        AND end_date <= CURRENT_DATE + INTERVAL '${days} days'
        AND end_date > CURRENT_DATE
      ORDER BY end_date ASC
    `;
    const result = await pool.query(query, [wholesalerId]);
    return result.rows;
  }

  static async acceptByVendor(contractId, vendorId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Check if already accepted
      const checkQuery = 'SELECT id FROM vendor_contracts WHERE contract_id = $1 AND vendor_id = $2';
      const existing = await client.query(checkQuery, [contractId, vendorId]);
      
      if (existing.rows.length > 0) {
        throw new Error('Contract already accepted');
      }
      
      // Insert vendor contract relationship
      const insertQuery = `
        INSERT INTO vendor_contracts (contract_id, vendor_id, accepted_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
      `;
      await client.query(insertQuery, [contractId, vendorId]);
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async updateByWholesaler(contractId, wholesalerId, updates) {
    const allowedFields = ['product_name', 'daily_quantity', 'price_per_unit', 'description'];
    const updateFields = Object.keys(updates).filter(key => allowedFields.includes(key));
    
    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }
    
    const setClause = updateFields.map((field, index) => `${field} = $${index + 3}`).join(', ');
    const query = `
      UPDATE contracts 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND wholesaler_id = $2
      RETURNING *
    `;
    
    const values = [contractId, wholesalerId, ...updateFields.map(field => updates[field])];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async deactivateByWholesaler(contractId, wholesalerId) {
    const query = `
      UPDATE contracts 
      SET status = 'inactive', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND wholesaler_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [contractId, wholesalerId]);
    return result.rows[0];
  }

  static async search(queryText, location) {
    let query = `
      SELECT c.*, u.name as wholesaler_name, u.business_name
      FROM contracts c
      JOIN users u ON c.wholesaler_id = u.id
      WHERE c.status = 'active' 
        AND c.end_date > CURRENT_DATE
    `;
    const params = [];
    
    if (queryText) {
      query += ` AND (c.product_name ILIKE $${params.length + 1} OR c.description ILIKE $${params.length + 1})`;
      params.push(`%${queryText}%`);
    }
    
    if (location) {
      query += ` AND u.address ILIKE $${params.length + 1}`;
      params.push(`%${location}%`);
    }
    
    query += ` ORDER BY c.created_at DESC`;
    
    const result = await pool.query(query, params);
    return result.rows;
  }
}

module.exports = Contract;
