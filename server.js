const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const bcrypt = require('bcrypt');
const path = require('path');
const i18n = require('i18n');
const { Pool } = require('pg');
const expressLayouts = require('express-ejs-layouts');

// Import configurations and middleware
const { pool } = require('./config/database');
require('./config/i18n');

// Import routes
const authRoutes = require('./routes/auth');
const vendorRoutes = require('./routes/vendor');
const wholesalerRoutes = require('./routes/wholesaler');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 10000;

// Configure i18n
app.use(i18n.init);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Session configuration
app.use(session({
  store: new pgSession({
    pool: pool,
    tableName: 'session'
  }),
  secret: process.env.SESSION_SECRET || 'vendorconnect-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// View engine setup
app.use(expressLayouts);
app.set('layout', 'layout');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Make user and i18n available in all templates
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.__ = res.__;
  res.locals.locale = req.getLocale();
  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/vendor', vendorRoutes);
app.use('/wholesaler', wholesalerRoutes);
app.use('/api', apiRoutes);

// Home route
app.get('/',(req, res) => {
  if (req.session.user) {
    if (req.session.user.role === 'vendor') {
      return res.redirect('/vendor/dashboard');
    } else if (req.session.user.role === 'wholesaler') {
      return res.redirect('/wholesaler/dashboard');
    }
  }
  res.render('index');
});

// Language switching route
app.get('/language/:lang', (req, res) => {
  const { lang } = req.params;
  const supportedLanguages = ['en', 'hi', 'es'];
  
  if (supportedLanguages.includes(lang)) {
    req.setLocale(lang);
  }
  
  const redirectUrl = req.get('Referer') || '/';
  res.redirect(redirectUrl);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { 
    message: res.__('error.general'),
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', {
    message: res.__('error.notFound'),
    error: {}
  });
});

// Start server
const server=app.listen(PORT, '0.0.0.0', () => {
  console.log(`VendorConnect server running on port ${PORT}`);
});

server.keepAliveTimeout = 120000;
server.headersTimeout = 120000;
module.exports = app;
