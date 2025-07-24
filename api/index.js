import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import dotenv from 'dotenv'
import { cors } from 'hono/cors'  // <-- Import CORS middleware

import homeRoutes from '../routes/home.js'
import packagesRoutes from '../routes/packages.js'
import payments from '../routes/payments.js'
import identify from '../routes/identify.js'

dotenv.config()

const app = new Hono().basePath('/api')

// Enable CORS for all routes, allowing all origins
app.use('*', cors({
  origin: ['http://localhost:5173', 'https://wifi-frontend-one.vercel.app', 'https://moonlit-basbousa-ee48f7.netlify.app'],
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'x-api-key', 'Authorization']
}))

// Public routes
app.route('/', homeRoutes)
app.route('/packages', packagesRoutes)

// Protected routes
app.route('/payments', payments)
app.route('/identify', identify)

const handler = handle(app)

export const GET = handler
export const POST = handler
export const PATCH = handler
export const PUT = handler
export const OPTIONS = handler
