const express = require('express')
const jwt = require('jsonwebtoken')
const uuid = require('uuid/v4')
const passport = require('../services/passport')
const Users = require('../models/Users')
const { generateUserPayload } = require('../utils/jwt')
const router = express.Router()

const setAuthCookies = (req, res, user) => {
  const payload = generateUserPayload(user)
  const token = jwt.sign(payload, process.env.TOKEN_SECRET)
  const jwtComposition = token.split('.')
  const jwtPayload = jwtComposition.slice(1).join('.')
  const jwtSignature = jwtComposition[0]
  // permanent
  res.cookie('auth.payload', jwtPayload, {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60, // 1 hour
    httpOnly: false,
    domain: req.get('origin'),
    sameSite: 'Lax' // https://www.chromestatus.com/feature/5088147346030592
  })
  // session
  res.cookie('auth.signature', jwtSignature, {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    domain: req.get('origin'),
    sameSite: 'Lax'
  })
  return token
}

router.post('/test/cookies', (req, res, next) => {
  try {
    const user = req.body || {
      id: 'test',
      email: 'test@example.com'
    }
    const token = jwt.sign(user, process.env.TOKEN_SECRET)
    const { httpOnly, sameSite, domain, secure, maxAge } = req.query
    const maxAgeNum = parseInt(maxAge, 10)
    const options = {
      secure: secure === 'true',
      httpOnly: httpOnly === 'true',
      domain,
      sameSite
    }
    if (!isNaN(maxAgeNum)) {
      options.maxAge = maxAgeNum
    }
    res.cookie('test.cookie', token, options)
    res.send({ token, cookie: res.get('Set-Cookie') })
  } catch (error) {
    next(error)
  }
})

router.get('/verify', passport.isAuthenticated, (req, res) => {
  res.send(req.user)
})

router.post('/logout', (req, res) => {
  res.send('logging out')
})

router.post('/email', async (req, res, next) => {
  try {
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
    const token = setAuthCookies(req, res, user)
    res.send({ user, token })
  } catch (error) {
    next(error)
  }
})

const googleOptions = { scope: ['profile', 'email', 'openid'] }
router.get('/google', passport.authenticate('google', googleOptions))
router.get('/google/redirect', passport.authenticate('google'), (req, res) => {
  const token = setAuthCookies(req, res, req.user)
  res.redirect(process.env.CLIENT_ORIGIN)
})

const linkedinOptions = {
  scope: ['r_emailaddress', 'r_liteprofile', 'w_member_social']
}
router.get('/linkedin', passport.authenticate('linkedin', linkedinOptions))
router.get(
  '/linkedin/redirect',
  passport.authenticate('linkedin'),
  (req, res) => {
    const token = setAuthCookies(req, res, req.user)
    res.redirect(process.env.CLIENT_ORIGIN)
  }
)

router.get('/', passport.isAuthenticated, (req, res) => {
  res.send(req.user)
})

module.exports = router
