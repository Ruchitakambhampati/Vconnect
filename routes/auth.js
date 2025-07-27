const express = require('express');
const bcrypt = require('bcrypt');
const { pool } = require('../config/database');
const User = require('../models/User');

const router = express.Router();

// Login page
router.get('/login', (req, res) => {
  if (req.session.user) {
    const redirectUrl = req.session.user.role === 'vendor' ? '/vendor/dashboard' : '/wholesaler/dashboard';
    return res.redirect(redirectUrl);
  }
  res.render('auth/login', { error: null });
});

// Register page
router.get('/register', (req, res) => {
  if (req.session.user) {
    const redirectUrl = req.session.user.role === 'vendor' ? '/vendor/dashboard' : '/wholesaler/dashboard';
    return res.redirect(redirectUrl);
  }
  res.render('auth/register', { error: null });
});

// Login POST
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findByEmail(email);
    if (!user) {
      return res.render('auth/login', { error: res.__('auth.invalidCredentials') });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.render('auth/login', { error: res.__('auth.invalidCredentials') });
    }

    // Store user in session
    req.session.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone
    };

    const redirectUrl = user.role === 'vendor' ? '/vendor/dashboard' : '/wholesaler/dashboard';
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Login error:', error);
    res.render('auth/login', { error: res.__('error.general') });
  }
});

// Register POST
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, confirmPassword, phone, role, businessName, address } = req.body;

    // Validation
    if (password !== confirmPassword) {
      return res.render('auth/register', { error: res.__('auth.passwordMismatch') });
    }

    if (!['vendor', 'wholesaler'].includes(role)) {
      return res.render('auth/register', { error: res.__('auth.invalidRole') });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.render('auth/register', { error: res.__('auth.userExists') });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role,
      businessName: businessName || null,
      address: address || null
    });

    // Store user in session
    req.session.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone
    };

    const redirectUrl = user.role === 'vendor' ? '/vendor/dashboard' : '/wholesaler/dashboard';
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Registration error:', error);
    res.render('auth/register', { error: res.__('error.general') });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/');
  });
});

module.exports = router;
