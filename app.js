require('dotenv-defaults').config()
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
    if (process.env.MONGODB_URI) {
      console.log('Connected to Mongo DB')
    } else {
      console.warn(
        'Please add MONGODB_URI to your .env for this app to work properly'
      )
      process.exit(1)
    }
  }
)

app.use('/auth', authRouter)
app.get('/', (req, res) => {
  res.redirect(process.env.CLIENT_ORIGIN)
})

app.use((err, req, res, next) => {
  console.error(err)
  if (!res.headersSent) {
    res.status(err.status || 400).send({ error: err.message })
  }
})

module.exports = app
