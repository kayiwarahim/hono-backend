import { Hono } from 'hono'

const packages = [
  { label: "24 Hours", value: 1000, price: "UGX 1000", duration: "Full Day", color: "from-green-500 to-emerald-600" },
  { label: "7 Days", value: 6000, price: "UGX 6000", duration: "Full Week", color: "from-green-500 to-emerald-600" },
  { label: "12 Hours", value: 500, price: "UGX 500", duration: "Half Day",  color: "from-green-500 to-emerald-600" },
  { label: "30 Days", value: 25000, price: "UGX 25000", duration: "Full Month", color: "from-green-500 to-emerald-600" },
  { label: "90 Days", value: 70000, price: "UGX 70000", duration: "Full Quarter", color: "from-green-500 to-emerald-600" },
  { label: "180 Days", value: 120000, price: "UGX 120000", duration: "Full Half Year", color: "from-green-500 to-emerald-600" },
]

const packagesRouter = new Hono()

packagesRouter.get('/', (c) => c.json(packages))

export default packagesRouter
