const express = require('express');
const { requireAuth, requireVendor } = require('../middleware/auth');
const Contract = require('../models/Contract');
const Order = require('../models/Order');

const router = express.Router();

// Apply auth middleware to all vendor routes
router.use(requireAuth);
router.use(requireVendor);

// Vendor Dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.session.user.id;
    
    // Get vendor statistics
    const activeOrders = await Order.getActiveByVendor(userId);
    const totalOrders = await Order.getTotalByVendor(userId);
    const availableContracts = await Contract.getAvailableForVendor(userId);
    const freeAttemptsRemaining = await Order.getFreeAttemptsRemaining(userId);

    res.render('vendor/dashboard', {
      activeOrders: activeOrders.length,
      totalOrders,
      availableContracts: availableContracts.length,
      freeAttemptsRemaining,
      recentOrders: activeOrders.slice(0, 5)
    });
  } catch (error) {
    console.error('Vendor dashboard error:', error);
    res.render('error', { message: res.__('error.general'), error: {} });
  }
});

// Available Contracts
router.get('/contracts', async (req, res) => {
  try {
    const userId = req.session.user.id;
    const contracts = await Contract.getAvailableForVendor(userId);
    const myContracts = await Contract.getByVendor(userId);
    
    res.render('vendor/contracts', { 
      contracts,
      myContracts
    });
  } catch (error) {
    console.error('Vendor contracts error:', error);
    res.render('error', { message: res.__('error.general'), error: {} });
  }
});

// My Orders
router.get('/orders', async (req, res) => {
  try {
    const userId = req.session.user.id;
    const orders = await Order.getByVendor(userId);
    const freeAttemptsRemaining = await Order.getFreeAttemptsRemaining(userId);
    const cancellationsRemaining = await Order.getCancellationsRemaining(userId);
    
    res.render('vendor/orders', { 
      orders,
      freeAttemptsRemaining,
      cancellationsRemaining
    });
  } catch (error) {
    console.error('Vendor orders error:', error);
    res.render('error', { message: res.__('error.general'), error: {} });
  }
});

// Accept Contract
router.post('/contract/:id/accept', async (req, res) => {
  try {
    const contractId = req.params.id;
    const vendorId = req.session.user.id;
    
    await Contract.acceptByVendor(contractId, vendorId);
    res.json({ success: true, message: res.__('contract.accepted') });
  } catch (error) {
    console.error('Accept contract error:', error);
    res.status(500).json({ success: false, message: res.__('error.general') });
  }
});

// Place Order
router.post('/order', async (req, res) => {
  try {
    const { contractId, quantity } = req.body;
    const vendorId = req.session.user.id;
    
    // Check if vendor has free attempts or active contract
    const canOrder = await Order.canVendorPlaceOrder(vendorId, contractId);
    if (!canOrder.allowed) {
      return res.status(400).json({ 
        success: false, 
        message: canOrder.reason 
      });
    }
    
    const order = await Order.create({
      vendorId,
      contractId,
      quantity,
      status: 'pending'
    });
    
    res.json({ success: true, message: res.__('order.placed'), orderId: order.id });
  } catch (error) {
    console.error('Place order error:', error);
    res.status(500).json({ success: false, message: res.__('error.general') });
  }
});

// Cancel Order
router.post('/order/:id/cancel', async (req, res) => {
  try {
    const orderId = req.params.id;
    const vendorId = req.session.user.id;
    
    const canCancel = await Order.canVendorCancelOrder(vendorId, orderId);
    if (!canCancel.allowed) {
      return res.status(400).json({ 
        success: false, 
        message: canCancel.reason 
      });
    }
    
    await Order.cancelByVendor(orderId, vendorId);
    res.json({ success: true, message: res.__('order.cancelled') });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ success: false, message: res.__('error.general') });
  }
});

module.exports = router;
