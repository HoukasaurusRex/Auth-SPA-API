const express = require('express')
const jwt = require('jsonwebtoken')
const uuid = require('uuid/v4')
const passport = require('../services/passport')
const Users = require('../models/Users')
const { generateUserPayload } = require('../utils/jwt')
const router = express.Router()

const setAuthCookies = (user, res) => {
  const payload = generateUserPayload(user)
  const token = jwt.sign(payload, process.env.TOKEN_SECRET)
  const jwtComposition = token.split('.')
  const jwtPayload = jwtComposition.slice(1).join('.')
  const jwtSignature = jwtComposition[0]
  // permanent
  res.cookie('Auth-Payload', jwtPayload, {
    secure: process.env.NODE_ENV !== 'development',
    maxAge: 1000 * 60 * 30, // 1 hour
    httpOnly: false
  })
  // session
  res.cookie('Auth-Signature', jwtSignature, {
    secure: process.env.NODE_ENV !== 'development',
    httpOnly: true
  })
  return token
}

router.get('/verify', passport.isAuthenticated, (req, res) => {
  res.send(req.user)
})

router.post('/logout', (req, res) => {
  res.send('logging out')
})

router.post('/email', async (req, res) => {
  if (!req.body.email || !req.body.password) {
    return res.status(400).send({ error: 'Email or password missing' })
  }
  const user =
    (await Users.findOne({ email: req.body.email })) ||
    (await Users.create({
      email: req.body.email,
      password: req.body.password,
      sessionSecret: uuid()
    }))

  if (user.password !== req.body.password) {
    res.status(400).send({ error: 'Incorrect email or password' })
    return
  }
  const token = setAuthCookies(user, res)
  res.send({ user, token })
})

const googleOptions = { scope: ['profile', 'email', 'openid'] }
router.get('/google', passport.authenticate('google', googleOptions))
router.get('/google/redirect', passport.authenticate('google'), (req, res) => {
  const token = setAuthCookies(req.user, res)
  res.redirect('http://localhost:8080/')
})

const linkedinOptions = {
  scope: ['r_emailaddress', 'r_liteprofile', 'w_member_social']
}
router.get('/linkedin', passport.authenticate('linkedin', linkedinOptions))
router.get(
  '/linkedin/redirect',
  passport.authenticate('linkedin'),
  (req, res) => {
    const token = setAuthCookies(req.user, res)
    res.redirect('http://localhost:8080/')
  }
)

router.get('/', passport.isAuthenticated, (req, res) => {
  res.send(req.user)
})

module.exports = router