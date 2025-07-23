import { Hono } from 'hono'

const home = new Hono()

home.get('/', (c) => {
  return c.json({ message: "backend running fine" })
})

export default home
