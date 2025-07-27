const { pool } = require('../config/database');

class Order {
  static async findById(id) {
    const query = `
      SELECT o.*, c.product_name, c.price_per_unit, 
             u.name as vendor_name, u.phone as vendor_phone,
             w.name as wholesaler_name, w.business_name
      FROM orders o
      JOIN contracts c ON o.contract_id = c.id
      JOIN users u ON o.vendor_id = u.id
      JOIN users w ON c.wholesaler_id = w.id
      WHERE o.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async create(orderData) {
    const { vendorId, contractId, quantity, status } = orderData;
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Get contract details
      const contractQuery = 'SELECT price_per_unit FROM contracts WHERE id = $1';
      const contractResult = await client.query(contractQuery, [contractId]);
      const contract = contractResult.rows[0];
      
      if (!contract) {
        throw new Error('Contract not found');
      }
      
      const totalAmount = contract.price_per_unit * quantity;
      
      // Create order
      const orderQuery = `
        INSERT INTO orders (vendor_id, contract_id, quantity, total_amount, status, delivery_date)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + 1); // Next day delivery
      
      const values = [vendorId, contractId, quantity, totalAmount, status, deliveryDate];
      const result = await client.query(orderQuery, values);
      
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getByVendor(vendorId) {
    const query = `
      SELECT o.*, c.product_name, c.price_per_unit,
             u.name as wholesaler_name, u.business_name
      FROM orders o
      JOIN contracts c ON o.contract_id = c.id
      JOIN users u ON c.wholesaler_id = u.id
      WHERE o.vendor_id = $1
      ORDER BY o.created_at DESC
    `;
    const result = await pool.query(query, [vendorId]);
    return result.rows;
  }

  static async getActiveByVendor(vendorId) {
    const query = `
      SELECT o.*, c.product_name, c.price_per_unit,
             u.name as wholesaler_name, u.business_name
      FROM orders o
      JOIN contracts c ON o.contract_id = c.id
      JOIN users u ON c.wholesaler_id = u.id
      WHERE o.vendor_id = $1 AND o.status IN ('pending', 'confirmed')
      ORDER BY o.delivery_date ASC
    `;
    const result = await pool.query(query, [vendorId]);
    return result.rows;
  }

  static async getTotalByVendor(vendorId) {
    const query = 'SELECT COUNT(*) as count FROM orders WHERE vendor_id = $1';
    const result = await pool.query(query, [vendorId]);
    return parseInt(result.rows[0].count);
  }

  static async getFreeAttemptsRemaining(vendorId) {
    const query = 'SELECT free_attempts_used FROM users WHERE id = $1';
    const result = await pool.query(query, [vendorId]);
    const attemptsUsed = result.rows[0]?.free_attempts_used || 0;
    return Math.max(0, 5 - attemptsUsed);
  }

  static async getCancellationsRemaining(vendorId) {
    const query = 'SELECT cancellations_used FROM users WHERE id = $1';
    const result = await pool.query(query, [vendorId]);
    const cancellationsUsed = result.rows[0]?.cancellations_used || 0;
    return Math.max(0, 5 - cancellationsUsed);
  }

  static async canVendorPlaceOrder(vendorId, contractId) {
    // Check if vendor has accepted the contract
    const contractQuery = `
      SELECT vc.id FROM vendor_contracts vc 
      WHERE vc.vendor_id = $1 AND vc.contract_id = $2
    `;
    const contractResult = await pool.query(contractQuery, [vendorId, contractId]);
    
    if (contractResult.rows.length > 0) {
      return { allowed: true };
    }
    
    // Check free attempts
    const freeAttemptsRemaining = await this.getFreeAttemptsRemaining(vendorId);
    if (freeAttemptsRemaining > 0) {
      return { allowed: true };
    }
    
    return { 
      allowed: false, 
      reason: 'You need to accept a contract or have used all free attempts' 
    };
  }

  static async canVendorCancelOrder(vendorId, orderId) {
    // Check if order belongs to vendor and is cancellable
    const orderQuery = `
      SELECT * FROM orders 
      WHERE id = $1 AND vendor_id = $2 AND status IN ('pending', 'confirmed')
    `;
    const orderResult = await pool.query(orderQuery, [orderId, vendorId]);
    
    if (orderResult.rows.length === 0) {
      return { allowed: false, reason: 'Order not found or not cancellable' };
    }
    
    // Check cancellation limit
    const cancellationsRemaining = await this.getCancellationsRemaining(vendorId);
    if (cancellationsRemaining <= 0) {
      return { allowed: false, reason: 'Cancellation limit exceeded' };
    }
    
    return { allowed: true };
  }

  static async cancelByVendor(orderId, vendorId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Update order status
      const updateOrderQuery = `
        UPDATE orders 
        SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND vendor_id = $2
      `;
      await client.query(updateOrderQuery, [orderId, vendorId]);
      
      // Increment cancellation count
      const updateUserQuery = `
        UPDATE users 
        SET cancellations_used = COALESCE(cancellations_used, 0) + 1
        WHERE id = $1
      `;
      await client.query(updateUserQuery, [vendorId]);
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getTodayDeliveriesByWholesaler(wholesalerId) {
    const query = `
      SELECT o.*, c.product_name, u.name as vendor_name, u.phone as vendor_phone
      FROM orders o
      JOIN contracts c ON o.contract_id = c.id
      JOIN users u ON o.vendor_id = u.id
      WHERE c.wholesaler_id = $1 
        AND DATE(o.delivery_date) = CURRENT_DATE
        AND o.status IN ('pending', 'confirmed')
      ORDER BY o.created_at ASC
    `;
    const result = await pool.query(query, [wholesalerId]);
    return result.rows;
  }

  static async getDeliveriesByDate(wholesalerId, date) {
    const query = `
      SELECT o.*, c.product_name, u.name as vendor_name, u.phone as vendor_phone
      FROM orders o
      JOIN contracts c ON o.contract_id = c.id
      JOIN users u ON o.vendor_id = u.id
      WHERE c.wholesaler_id = $1 
        AND DATE(o.delivery_date) = $2
      ORDER BY o.status ASC, o.created_at ASC
    `;
    const result = await pool.query(query, [wholesalerId, date]);
    return result.rows;
  }

  static async getTodayEarningsByWholesaler(wholesalerId) {
    const query = `
      SELECT COALESCE(SUM(o.total_amount), 0) as earnings
      FROM orders o
      JOIN contracts c ON o.contract_id = c.id
      WHERE c.wholesaler_id = $1 
        AND DATE(o.delivery_date) = CURRENT_DATE
        AND o.status = 'delivered'
    `;
    
    const result = await pool.query(query, [wholesalerId]);
    
    return parseFloat(result.rows[0].earnings);
  }

  static async getTotalEarningsByWholesaler(wholesalerId) {
    const query = `
      SELECT COALESCE(SUM(o.total_amount), 0) as earnings
      FROM orders o
      JOIN contracts c ON o.contract_id = c.id
      WHERE c.wholesaler_id = $1 AND o.status = 'delivered'
    `;
    const result = await pool.query(query, [wholesalerId]);
    return parseFloat(result.rows[0].earnings);
  }

  static async markAsDelivered(orderId, wholesalerId) {
    const query = `
      UPDATE orders 
      SET status = 'delivered', 
          delivered_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 
        AND contract_id IN (SELECT id FROM contracts WHERE wholesaler_id = $2)
        AND status IN ('pending', 'confirmed')
      RETURNING *
    `;
    const result = await pool.query(query, [orderId, wholesalerId]);
    return result.rows[0];
  }
}

module.exports = Order;
