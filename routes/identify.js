// routes/identify.js
import { Hono } from 'hono'

const identify = new Hono()

identify.post('/identify-device', async (c) => {
  const json = await c.req.json()
  const { deviceId } = json

  // Optional: Save or log the deviceId
  console.log('Received device ID:', deviceId)

  return c.json({ success: true, deviceId })
})

export default identify
