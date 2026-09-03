const router = require('express').Router()
const passport = require('passport')
const Account = require('../db/Account')
const { ROLES, DEFAULT_ROLE } = Account

function requireAdmin(req, res, next) {
  if (!req.isAuthenticated() || req.user.role !== 'admin') {
    return res.sendStatus(403)
  }
  next()
}

router.post('/register', function(req, res, next) {
  console.log('registering user')
  const { username, firstName, lastName } = req.body

  Account.register(
    new Account({ username, firstName, lastName, role: DEFAULT_ROLE }),
    req.body.password,
    function(err) {
      if (err) {
        return next(err)
      }

      res.sendStatus(200)
    }
  )
})

router.post('/login', passport.authenticate('local'), function(req, res) {
  const { username, role } = req.user
  res.json({ username, role })
})

router.put('/users/:username/role', requireAdmin, function(req, res, next) {
  const { role } = req.body
  if (!ROLES.includes(role)) {
    return res.status(400).json({ error: 'invalid role' })
  }

  Account.findOneAndUpdate(
    { username: req.params.username },
    { role },
    { new: true },
    function(err, account) {
      if (err) {
        return next(err)
      }
      if (!account) {
        return res.sendStatus(404)
      }
      res.json({ username: account.username, role: account.role })
    }
  )
})

router.get('/logout', function(req, res) {
  req.logout()
  res.sendStatus(200)
})

module.exports = router
