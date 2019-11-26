require('dotenv-defaults')
const express = require('express')
const cookieParser = require('cookie-parser')
const logger = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const mongoose = require('mongoose')
const passport = require('./services/passport')

const authRouter = require('./routes/auth')

const app = express()

app.use(helmet())
app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(
  cors({
    // origin must not be a wildcard to receive cross domain cookies
    origin: process.env.CLIENT_ORIGIN,
    credentials: true
  })
)
app.use(passport.initialize())

mongoose.connect(
  process.env.MONGODB_URI,
  { useNewUrlParser: true, useUnifiedTopology: true },
  () => {
    console.log('Connected to Mongo DB')
  }
)

app.use('/auth', authRouter)
app.get('/', (req, res) => {
  res.redirect(process.env.CLIENT_ORIGIN)
})

module.exports = app
