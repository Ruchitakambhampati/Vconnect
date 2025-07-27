const express = require('express');
const { requireAuth, requireWholesaler } = require('../middleware/auth');
const Contract = require('../models/Contract');
const Order = require('../models/Order');

const router = express.Router();

// Apply auth middleware to all wholesaler routes
router.use(requireAuth);
router.use(requireWholesaler);

// Wholesaler Dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.session.user.id;
    
    // Get wholesaler statistics
    const activeContracts = await Contract.getActiveByWholesaler(userId);
    const todayDeliveries = await Order.getTodayDeliveriesByWholesaler(userId);
    const earnings = await Order.getTodayEarningsByWholesaler(userId);
    const contractsEndingSoon = await Contract.getEndingSoonByWholesaler(userId);

    res.render('wholesaler/dashboard', {
      activeContracts: activeContracts.length,
      todayDeliveries: todayDeliveries.length,
      earnings: earnings || 0,
      contractsEndingSoon,
      recentOrders: todayDeliveries.slice(0, 5)
    });
  } catch (error) {
    console.error('Wholesaler dashboard error:', error);
    res.render('error', { message: res.__('error.general'), error: {} });
  }
});

// Contract Management
router.get('/contracts', async (req, res) => {
  try {
    const userId = req.session.user.id;
    const contracts = await Contract.getByWholesaler(userId);
    
    res.render('wholesaler/contracts', { contracts });
  } catch (error) {
    console.error('Wholesaler contracts error:', error);
    res.render('error', { message: res.__('error.general'), error: {} });
  }
});

// Delivery Management
router.get('/deliveries', async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { date } = req.query;
    const selectedDate = date || new Date().toISOString().split('T')[0];
    
    const deliveries = await Order.getDeliveriesByDate(userId, selectedDate);
    
    res.render('wholesaler/deliveries', { 
      deliveries,
      selectedDate
    });
  } catch (error) {
    console.error('Wholesaler deliveries error:', error);
    res.render('error', { message: res.__('error.general'), error: {} });
  }
});

// Create Contract
router.post('/contract', async (req, res) => {
  try {
    const { productName, dailyQuantity, pricePerUnit, duration, description } = req.body;
    const wholesalerId = req.session.user.id;
    
    const contract = await Contract.create({
      wholesalerId,
      productName,
      dailyQuantity: parseInt(dailyQuantity),
      pricePerUnit: parseFloat(pricePerUnit),
      duration: parseInt(duration),
      description,
      status: 'active'
    });
    
    res.json({ success: true, message: res.__('contract.created'), contractId: contract.id });
  } catch (error) {
    console.error('Create contract error:', error);
    res.status(500).json({ success: false, message: res.__('error.general') });
  }
});

// Update Contract
router.put('/contract/:id', async (req, res) => {
  try {
    const contractId = req.params.id;
    const wholesalerId = req.session.user.id;
    const updates = req.body;
    
    await Contract.updateByWholesaler(contractId, wholesalerId, updates);
    res.json({ success: true, message: res.__('contract.updated') });
  } catch (error) {
    console.error('Update contract error:', error);
    res.status(500).json({ success: false, message: res.__('error.general') });
  }
});

// Mark Order as Delivered
router.post('/order/:id/delivered', async (req, res) => {
  try {
    const orderId = req.params.id;
    const wholesalerId = req.session.user.id;
    
    await Order.markAsDelivered(orderId, wholesalerId);
    res.json({ success: true, message: res.__('order.marked_delivered') });
  } catch (error) {
    console.error('Mark delivered error:', error);
    res.status(500).json({ success: false, message: res.__('error.general') });
  }
});

// Deactivate Contract
router.post('/contract/:id/deactivate', async (req, res) => {
  try {
    const contractId = req.params.id;
    const wholesalerId = req.session.user.id;
    
    await Contract.deactivateByWholesaler(contractId, wholesalerId);
    res.json({ success: true, message: res.__('contract.deactivated') });
  } catch (error) {
    console.error('Deactivate contract error:', error);
    res.status(500).json({ success: false, message: res.__('error.general') });
  }
});

module.exports = router;
