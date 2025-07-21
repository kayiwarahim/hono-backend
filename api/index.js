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
app.use('*', cors())

// Public routes
homeRoutes(app)
packagesRoutes(app)

// Protected route
app.route('/payments', payments)
app.route('/identify', identify)

const handler = handle(app)

export const GET = handler
export const POST = handler
export const PATCH = handler
export const PUT = handler
export const OPTIONS = handler
