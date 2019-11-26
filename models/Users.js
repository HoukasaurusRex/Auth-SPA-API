const mongoose = require('mongoose')
const Schema = mongoose.Schema

const userSchema = new Schema({
  email: String,
  password: String,
  sessionSecret: String,
  username: String,
  avatar: String,
  locale: String,
  googleId: String,
  linkedinId: String
})

module.exports = mongoose.model('Users', userSchema)
