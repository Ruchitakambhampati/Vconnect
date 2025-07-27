const express = require('express');
const { requireAuth } = require('../middleware/auth');
const Contract = require('../models/Contract');
const Order = require('../models/Order');

const router = express.Router();

// Apply auth middleware to all API routes
router.use(requireAuth);

// Get contract details
router.get('/contract/:id', async (req, res) => {
  try {
    const contractId = req.params.id;
    const contract = await Contract.findById(contractId);
    
    if (!contract) {
      return res.status(404).json({ error: res.__('contract.notFound') });
    }
    
    res.json(contract);
  } catch (error) {
    console.error('Get contract error:', error);
    res.status(500).json({ error: res.__('error.general') });
  }
});

// Get order details
router.get('/order/:id', async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ error: res.__('order.notFound') });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: res.__('error.general') });
  }
});

// Search contracts
router.get('/contracts/search', async (req, res) => {
  try {
    const { query, location } = req.query;
    const contracts = await Contract.search(query, location);
    
    res.json(contracts);
  } catch (error) {
    console.error('Search contracts error:', error);
    res.status(500).json({ error: res.__('error.general') });
  }
});

// Get vendor statistics
router.get('/vendor/stats', async (req, res) => {
  try {
    const vendorId = req.session.user.id;
    
    if (req.session.user.role !== 'vendor') {
      return res.status(403).json({ error: res.__('error.accessDenied') });
    }
    
    const stats = {
      totalOrders: await Order.getTotalByVendor(vendorId),
      activeOrders: await Order.getActiveByVendor(vendorId),
      freeAttemptsRemaining: await Order.getFreeAttemptsRemaining(vendorId),
      cancellationsRemaining: await Order.getCancellationsRemaining(vendorId)
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Get vendor stats error:', error);
    res.status(500).json({ error: res.__('error.general') });
  }
});

// Get wholesaler statistics
router.get('/wholesaler/stats', async (req, res) => {
  try {
    const wholesalerId = req.session.user.id;
    
    if (req.session.user.role !== 'wholesaler') {
      return res.status(403).json({ error: res.__('error.accessDenied') });
    }
    
    const stats = {
      activeContracts: await Contract.getActiveByWholesaler(wholesalerId),
      todayDeliveries: await Order.getTodayDeliveriesByWholesaler(wholesalerId),
      totalEarnings: await Order.getTotalEarningsByWholesaler(wholesalerId),
      todayEarnings: await Order.getTodayEarningsByWholesaler(wholesalerId)
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Get wholesaler stats error:', error);
    res.status(500).json({ error: res.__('error.general') });
  }
});

module.exports = router;
