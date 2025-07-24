// routes/payments.js
import { Hono } from 'hono'
import { requestPayment, checkRequestStatus } from '../services/relworxClient.js'
import { requireApiKey } from '../middleware/auth.js'
import { supabase } from '../config/supabase.js'

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

    // Store transaction in Supabase
    const transactionData = {
      reference,
      device_id,
      phone: phoneNumber,
      formatted_phone: formattedPhone,
      amount,
      currency,
      description,
      relworx_reference: response.data?.internal_reference,
      relworx_status: response.data?.status || 'pending',
      relworx_message: response.data?.message,
      relworx_response: response.data,
      status: 'pending',
      payment_method: 'mobile_money',
      user_agent: c.req.header('user-agent'),
      ip_address: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown'
    }

    const { data: savedTransaction, error: saveError } = await supabase
      .from('transactions')
      .insert([transactionData])
      .select()
      .single()

    if (saveError) {
      console.error('Error saving transaction to Supabase:', saveError)
      // Continue anyway - don't fail the payment because of DB issues
    } else {
      console.log('Transaction saved to Supabase:', savedTransaction.id)
    }
    
    return c.json({ 
      success: true, 
      data: response.data,
      reference: reference,
      transaction_id: savedTransaction?.id
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
    
    // Update transaction status in Supabase
    const statusUpdate = {
      relworx_status: response.data?.status || 'pending',
      relworx_message: response.data?.message,
      relworx_response: response.data,
      status: response.data?.status || 'pending',
      updated_at: new Date().toISOString()
    }

    // Set timestamp based on status
    if (response.data?.status === 'confirmed') {
      statusUpdate.confirmed_at = new Date().toISOString()
    } else if (response.data?.status === 'failed') {
      statusUpdate.failed_at = new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from('transactions')
      .update(statusUpdate)
      .eq('reference', reference)

    if (updateError) {
      console.error('Error updating transaction status:', updateError)
    }
    
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
    
    // Update transaction with failed status
    await supabase
      .from('transactions')
      .update({
        status: 'failed',
        failed_at: new Date().toISOString(),
        relworx_message: err.message
      })
      .eq('reference', c.req.param('reference'))
    
    return c.json({ 
      success: false, 
      error: err.message,
      status: 'failed'
    }, 500)
  }
})

// Get transaction by reference
payments.get('/transaction/:reference', async (c) => {
  try {
    const reference = c.req.param('reference')
    
    const { data: transaction, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('reference', reference)
      .single()

    if (error) {
      return c.json({ success: false, error: 'Transaction not found' }, 404)
    }

    return c.json({ success: true, data: transaction })
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500)
  }
})

// Get transactions by device_id
payments.get('/device/:device_id/transactions', async (c) => {
  try {
    const device_id = c.req.param('device_id')
    const limit = parseInt(c.req.query('limit')) || 10
    
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('device_id', device_id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      return c.json({ success: false, error: error.message }, 500)
    }

    return c.json({ success: true, data: transactions })
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500)
  }
})

export default payments
