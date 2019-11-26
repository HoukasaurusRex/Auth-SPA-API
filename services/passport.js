const passport = require('passport')
const jwt = require('jsonwebtoken')
const expressJWT = require('express-jwt')
const uuid = require('uuid/v4')
const GoogleStrategy = require('passport-google-oauth20')
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy
const Users = require('../models/Users')
const { generateUserPayload } = require('../utils/jwt')

// To Client from Server
passport.serializeUser((user, done) => {
  done(null, user.id)
})

// To Server from Client Cookie
passport.deserializeUser(async (id, done) => {
  const user = await Users.findById(id)
  done(null, user)
})

// Parse Auth cookies as middleware
passport.isAuthenticated = expressJWT({
  secret: process.env.TOKEN_SECRET,
  getToken(req) {
    const signature = req.cookies['Auth-Signature']
    const payload = req.headers['authorization']
    if (!signature || !payload) {
      return null
    }
    return `${signature}.${payload}`
  }
})

// ANCHOR Google Auth
const googleOptions = {
  callbackURL: 'http://localhost:3030/auth/google/redirect',
  clientID: process.env.GOOGLE_ID,
  clientSecret: process.env.GOOGLE_SECRET
}
const googleCallback = async (_accessToken, _refreshToken, profile, done) => {
  const user =
    (await Users.findOne({
      $or: [{ googleId: profile.id }, { email: profile.emails[0].value }]
    })) ||
    (await Users.create({
      googleId: profile.id,
      sessionSecret: uuid(),
      email: profile.emails[0].value,
      username: profile.displayName,
      avatar: profile.photos[0].value,
      locale: profile['_json'].locale
    }))
  done(null, user)
}
passport.use('google', new GoogleStrategy(googleOptions, googleCallback))

// ANCHOR LinkedIn Auth
const linkedinOptions = {
  clientID: process.env.LINKEDIN_ID,
  clientSecret: process.env.LINKEDIN_SECRET,
  callbackURL: 'http://localhost:3030/auth/linkedin/redirect',
  scope: ['r_emailaddress', 'r_liteprofile']
}
const linkedinCallback = async (_accessToken, _refreshToken, profile, done) => {
  const user =
    (await Users.findOne({
      $or: [{ linkedinId: profile.id }, { email: profile.emails[0].value }]
    })) ||
    (await Users.create({
      linkedinId: profile.id,
      sessionSecret: uuid(),
      email: profile.emails[0].value,
      username: profile.displayName,
      avatar: profile.photos[1].value
    }))
  done(null, user)
}
passport.use(new LinkedInStrategy(linkedinOptions, linkedinCallback))

module.exports = passport
