import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateApiKey } from '../middleware/auth.js';
import { requestPayment, checkRequestStatus } from '../services/relworxClient.js';
import { body, param, query } from 'express-validator';
import { validateRequest } from '../middleware/validation.js';

// Helper to handle BigInt serialization
function jsonBigIntReplacer(key, value) {
  return typeof value === 'bigint' ? value.toString() : value;
}

const router = Router();
const TABLE_NAME = 'rahim'; // Upated to match your schema

// Validation schemas
const initiatePaymentSchema = [
  body('amount').isInt({ min: 1 }).withMessage('Amount must be a positive integer'),
  body('phone').isMobilePhone().withMessage('Invalid phone number'),
  body('currency').optional().isString().isLength({ min: 3, max: 3 }),
  body('description').optional().isString().isLength({ max: 255 })
];

// POST /api/payments/initiate
router.post('/initiate', authenticateApiKey, initiatePaymentSchema, validateRequest,
  async (req, res) => {
    const { amount, phone, currency = 'UGX', description = 'Payment Request' } = req.body;
    const reference = `WIFI_${Date.now()}`;

    try {
      // Clean phone number (keep as string, not BigInt)
      const phoneNumber = phone.replace(/\D/g, '');

      const { data: relworxData, error: relworxError } = await requestPayment({
        reference,
        msisdn: phone,
        currency,
        amount,
        description
      });

      if (relworxError) throw relworxError;

      // Insert into Supabase with proper types (no BigInt!)
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .insert({
          reference,
          amount: Number(amount),
          phone: phoneNumber,
          currency,
          description,
          status: relworxData.status || 'pending',
          relworx_transaction_id: relworxData.transaction_id || null
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201);
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        success: true,
        reference,
        relworx: relworxData,
        db_record: data
      }, jsonBigIntReplacer));
    } catch (error) {
      console.error('Payment initiation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to initiate payment',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// POST /api/payments/webhook
router.post('/webhook', [
  body('reference').isString().notEmpty(),
  body('status').isString().notEmpty(),
  body('transaction_id').optional().isString()
], validateRequest, async (req, res) => {
    const { reference, status, transaction_id } = req.body;

    try {
      const { data: existing, error: fetchError } = await supabase
        .from(TABLE_NAME)
        .select('status')
        .eq('reference', reference)
        .single();

      if (fetchError || !existing) {
        return res.status(404).json({ 
          success: false,
          error: 'Transaction not found' 
        });
      }

      const { data, error } = await supabase
        .from(TABLE_NAME)
        .update({
          status,
          relworx_transaction_id: transaction_id || null,
          updated_at: new Date().toISOString()
        })
        .eq('reference', reference)
        .select()
        .single();

      if (error) throw error;

      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        success: true,
        message: 'Payment status updated',
        previous_status: existing.status,
        updated_record: data
      }, jsonBigIntReplacer));
    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process webhook'
      });
    }
  }
);

// GET /api/payments/status/:reference
router.get('/status/:reference', authenticateApiKey, 
  param('reference').isString().notEmpty(), 
  query('live').optional().isBoolean(), 
  validateRequest,
  async (req, res) => {
    const { reference } = req.params;
    const live = req.query.live === 'true';

    try {
      if (live) {
        const { data, error: relworxError } = await checkRequestStatus(reference);
        if (relworxError) throw relworxError;
        return res.json({
          success: true,
          source: 'relworx_live',
          data
        });
      }

      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('reference', reference)
        .single();

      if (error) throw error;
      if (!data) return res.status(404).json({ success: false, error: 'Payment not found' });

      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        success: true,
        source: 'database',
        data
      }, jsonBigIntReplacer));
    } catch (error) {
      console.error('Status check error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check payment status'
      });
    }
  }
);

// GET /api/payments/history
router.get('/history', authenticateApiKey, 
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  validateRequest,
  async (req, res) => {
    const limit = req.query.limit || 20;
    const page = req.query.page || 1;
    const offset = (page - 1) * limit;

    try {
      const { data, error, count } = await supabase
        .from(TABLE_NAME)
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        success: true,
        data,
        pagination: {
          total: count,
          limit,
          page,
          total_pages: Math.ceil(count / limit)
        }
      }, jsonBigIntReplacer));
    } catch (error) {
      console.error('History fetch error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch payment history'
      });
    }
  }
);

export default router;