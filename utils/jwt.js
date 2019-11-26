exports.generateUserPayload = user => ({
  id: user.id,
  email: user.email,
  avatar: user.avatar,
  locale: user.locale
})
