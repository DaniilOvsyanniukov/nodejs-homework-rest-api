const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
require('dotenv').config()
const { v4: uuidv4 } = require('uuid')
const sgMail = require('@sendgrid/mail')
const { User } = require('../db/userModel')
const {
  ValidationError,
} = require('../helpers/errors')
const gravatar = require('gravatar')

const sendMail = async (email) => {
  const user = await User.findOne({ email })
  if (user.verify) {
    throw new ValidationError('Verification has already been passed')
  }
  const { SENDGRID_TOKEN } = process.env
  sgMail.setApiKey(SENDGRID_TOKEN)
  const mail = {
    to: `${email}`,
    from: 'ovsuanikov@gmail.com',
    subject: 'varigivation',
    html: `<a href="http://localhost:3010/api/users/verify/${user.verifyToken}"> Follow the link to register </a>`
  }
  sgMail.send(mail)
    .then(() => console.log('Email success send'))
    .catch(error => console.log(error))
}

const signupUser = async (email, password) => {
  const avatarURL = gravatar.url(email, { protocol: 'https', s: '100' })
  const UUID = uuidv4()
  const user = new User({ email, password, avatarURL, verifyToken: UUID })
  await user.save()
  await sendMail(email)
  const responseUser = {}
  responseUser.user = user
  return responseUser
}
const loginUser = async (email, password) => {
  const user = await User.findOne({ email })
  if (!user.verify) {
    throw new ValidationError('Confirm your registration')
  }
  if (!user || !await bcrypt.compare(password, user.password)) {
    throw new ValidationError('Email or password is wrong')
  }
  const token = jwt.sign({
    _id: user._id
  }, process.env.JWT_SECRET)
  await User.findByIdAndUpdate(user._id, { $set: { token: token } })
  const responseUser = {}
  responseUser.token = token
  responseUser.user = user
  return responseUser
}
const logoutUser = async (userId) => {
  const user = await User.findOne({ _id: userId })
  if (user === undefined) { return undefined }
  await User.findByIdAndUpdate(user._id, { $set: { token: null } })
  return user
}
const currentUser = async (userId) => {
  const user = await User.findOne({ _id: userId })
  if (!user.email || user.token === null) { return undefined }
  const responseUser = {}
  responseUser.email = user.email
  responseUser.subscription = user.subscription
  return responseUser
}

const addAvatar = async (_id, avatar) => {
  const user = await User.findOne({ _id })
  await User.findByIdAndUpdate(user._id, { $set: { avatarURL: avatar } })
  const responseUser = {}
  responseUser.avatar = avatar
  return responseUser
}

const findVarficationUser = async (verifyToken) => {
  const user = await User.findOne({ verifyToken })
  if (user) {
    await User.findByIdAndUpdate(user._id, { $set: { verify: true } })
    return true
  }
  return false
}

// ошибки таймкод 1:34:00

module.exports = {
  signupUser,
  loginUser,
  logoutUser,
  currentUser,
  addAvatar,
  findVarficationUser,
  sendMail,
}
