export default (app) => {
  app.get('/', (c) => {
    return c.json({ message: "backend running fine" })
  })
}
