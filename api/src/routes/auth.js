const router = require('express').Router()
const passport = require('passport')
const Account = require('../db/Account')

router.post('/register', async function(req, res, next) {
  console.log('registering user')
  const { username, firstName, lastName, role } = req.body

  try {
    const accountCount = await Account.countDocuments({})
    const isAdmin = req.isAuthenticated && req.isAuthenticated() &&
      req.user.role === 'admin'
    if (accountCount !== 0 && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden' })
    }

    await new Promise((resolve, reject) => {
      Account.register(
        new Account({ username, firstName, lastName, role }),
        req.body.password,
        function(err) {
          if (err) {
            return reject(err)
          }
          resolve()
        }
      )
    })

    res.sendStatus(200)
  } catch (err) {
    next(err)
  }
})

router.post('/login', passport.authenticate('local'), function(req, res) {
  const { username, role } = req.user
  res.json({ username, role })
})

router.get('/logout', function(req, res) {
  req.logout()
  res.sendStatus(200)
})

module.exports = router
