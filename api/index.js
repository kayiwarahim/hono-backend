import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import dotenv from 'dotenv'
import homeRoutes from '../routes/home.js'
import packageRoutes from '../routes/packages.js'
import { requireApiKey } from '../middleware/auth.js'

dotenv.config()

const app = new Hono().basePath('/api')

// 🔐 Secure routes
app.use('*', requireApiKey)

// Register routes
homeRoutes(app)
packageRoutes(app)

const handler = handle(app)

export const GET = handler
export const POST = handler
export const PATCH = handler
export const PUT = handler
export const OPTIONS = handler
