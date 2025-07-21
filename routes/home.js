export default (app) => {
  app.get('/', (c) => {
    return c.json({ message: "Congrats! You've deployed Hono to Vercel" })
  })
}
