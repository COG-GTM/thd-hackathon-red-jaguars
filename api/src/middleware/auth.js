const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next()
  }

  return res.status(401).json({ message: 'Authentication required' })
}

const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ message: 'Authentication required' })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' })
    }

    return next()
  }

const canModifyWish = (wish, user) =>
  user.role === 'admin' ||
  (wish.userId && String(wish.userId) === String(user._id))

module.exports = {
  ensureAuthenticated,
  requireRole,
  canModifyWish,
}
