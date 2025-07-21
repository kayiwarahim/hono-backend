// routes/payments.js
import { Hono } from 'hono'
import { requestPayment, checkRequestStatus } from '../services/relworxClient.js'
import { requireApiKey } from '../middleware/auth.js'

const payments = new Hono()

// Require API Key for all routes in this group
payments.use('*', requireApiKey)

// Initiate a payment
payments.post('/initiate', async (c) => {
  try {
    const body = await c.req.json()
    const { reference, msisdn, currency, amount, description } = body

    const response = await requestPayment({ reference, msisdn, currency, amount, description })
    return c.json({ success: true, data: response.data })
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500)
  }
})

// Check status of payment
payments.get('/status/:reference', async (c) => {
  try {
    const reference = c.req.param('reference')
    const response = await checkRequestStatus(reference)
    return c.json({ success: true, data: response.data })
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500)
  }
})

export default payments
