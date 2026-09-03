const mongoose = require('mongoose')

const Schema = mongoose.Schema

const passportLocalMongoose = require('passport-local-mongoose')

const ROLES = ['user', 'curator', 'manager', 'admin']
const DEFAULT_ROLE = 'user'

const Account = new Schema({
  firstName: String,
  lastName: String,
  role: { type: String, enum: ROLES, default: DEFAULT_ROLE },
  username: String
})

Account.plugin(passportLocalMongoose)

module.exports = mongoose.model('Account', Account)
module.exports.ROLES = ROLES
module.exports.DEFAULT_ROLE = DEFAULT_ROLE
