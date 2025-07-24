// routes/payments.js
import { Hono } from 'hono'
import { requestPayment, checkRequestStatus } from '../services/relworxClient.js'
import { requireApiKey } from '../middleware/auth.js'

const payments = new Hono()

// Require API Key for all routes in this group
payments.use('*', requireApiKey)

// Initiate a payment
// Test number for development: +256752225375
payments.post('/initiate', async (c) => {
  try {
    const body = await c.req.json()
    const reference = `WIFI_${Date.now()}`
    let { phone, msisdn, device_id, currency = 'UGX', amount, description = 'WiFi Internet Package' } = body
    const phoneNumber = phone || msisdn

    if (!phoneNumber || !amount) {
      return c.json({ 
        success: false, 
        error: 'Missing required fields: phone/msisdn and amount are required' 
      }, 400)
    }

    let formattedPhone = phoneNumber
    if (!formattedPhone.startsWith('+256')) {
      formattedPhone = formattedPhone.replace(/\D/g, '')
      
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '+256' + formattedPhone.substring(1)
      } else if (formattedPhone.startsWith('256')) {
        formattedPhone = '+' + formattedPhone 
      } else {
        formattedPhone = '+256' + formattedPhone
      }
    }

    // Validate Uganda mobile number format (+256 + 9 digits)
    if (!/^\+256[0-9]{9}$/.test(formattedPhone)) {
      return c.json({ 
        success: false, 
        error: 'Invalid mobile number format. Please use format: 07XXXXXXXX or +256XXXXXXXXX' 
      }, 400)
    }

    console.log('Payment request data:', { 
      reference, 
      msisdn: formattedPhone, 
      currency, 
      amount, 
      description,
      device_id 
    })

    const response = await requestPayment({ 
      reference, 
      msisdn: formattedPhone, 
      currency, 
      amount, 
      description 
    })
    
    return c.json({ 
      success: true, 
      data: response.data,
      reference: reference 
    })
  } catch (err) {
    console.error('Payment error:', err.response?.data || err.message)
    return c.json({ 
      success: false, 
      error: err.message,
      details: err.response?.data || 'No additional details'
    }, 500)
  }
})

// Check status of payment
payments.get('/status/:reference', async (c) => {
  try {
    const reference = c.req.param('reference')
    const live = c.req.query('live')
    
    console.log('Checking payment status for reference:', reference)
    
    const response = await checkRequestStatus(reference)
    
    // Format response to match what frontend expects
    const formattedResponse = {
      success: true,
      status: response.data?.status || 'pending',
      relworx: {
        status: response.data?.status || 'pending',
        ...response.data
      },
      data: response.data
    }
    
    console.log('Payment status response:', formattedResponse)
    
    return c.json(formattedResponse)
  } catch (err) {
    console.error('Status check error:', err.response?.data || err.message)
    return c.json({ 
      success: false, 
      error: err.message,
      status: 'failed'
    }, 500)
  }
})

export default payments
