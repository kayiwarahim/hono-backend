export const requireApiKey = (c, next) => {
  const key = c.req.header('x-api-key')

  const validKey = process.env.BACKEND_API_KEY
    if (!validKey) {
    return c.json({ error: 'Backend API Key is not set' }, 401)
  }
    if (key !== validKey) {
    return c.json({ error: 'Unauthorized: Invalid API Key' }, 403)
  }

  return next()
}
