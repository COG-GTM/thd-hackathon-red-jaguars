const STAFF_ROLES = ['admin', 'manager', 'curator']

const requireAuth = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next()
  }
  res.status(401).send({message: 'Authentication required'})
}

const requireRole = (...roles) => (req, res, next) => {
  if (roles.includes(req.user && req.user.role)) {
    return next()
  }
  res.status(403).send({message: 'Forbidden'})
}

const isStaff = user => STAFF_ROLES.includes(user && user.role)

module.exports = {
  requireAuth,
  requireRole,
  STAFF_ROLES,
  isStaff
}
