const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  next();
};

const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.session.user || req.session.user.role !== role) {
      return res.status(403).render('error', {
        message: res.__('error.accessDenied'),
        error: {}
      });
    }
    next();
  };
};

const requireVendor = requireRole('vendor');
const requireWholesaler = requireRole('wholesaler');

module.exports = {
  requireAuth,
  requireRole,
  requireVendor,
  requireWholesaler
};
