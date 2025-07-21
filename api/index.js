import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import dotenv from 'dotenv'

import homeRoutes from '../routes/home.js'
import packagesRoutes from '../routes/packages.js'
import payments  from '../routes/payments.js'

dotenv.config()

const app = new Hono().basePath('/api')

// Public routes
homeRoutes(app)
packagesRoutes(app)
  
// Protected route
app.route('/api/payments', payments)


const handler = handle(app)

export const GET = handler
export const POST = handler
export const PATCH = handler
export const PUT = handler
export const OPTIONS = handler
