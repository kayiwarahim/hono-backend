import { Hono } from 'hono'

const packages = [
  { label: "24 Hours", value: 1000, price: "UGX 1000", duration: "Full Day", speed: "3 Mbps", color: "from-purple-500 to-indigo-600" },
  { label: "7 Days", value: 6000, price: "UGX 6000", duration: "Full Week", speed: "4 Mbps", color: "from-blue-500 to-cyan-600" },
  { label: "12 Hours", value: 500, price: "UGX 500", duration: "Half Day", speed: "2 Mbps", color: "from-green-500 to-emerald-600" },
  { label: "30 Days", value: 25000, price: "UGX 25000", duration: "Full Month", speed: "5 Mbps", color: "from-yellow-500 to-orange-600" },
  { label: "90 Days", value: 70000, price: "UGX 70000", duration: "Full Quarter", speed: "6 Mbps", color: "from-red-500 to-pink-600" },
  { label: "180 Days", value: 120000, price: "UGX 120000", duration: "Full Half Year", speed: "7 Mbps", color: "from-purple-500 to-violet-600" },
]

const packagesRouter = new Hono()

packagesRouter.get('/', (c) => c.json(packages))

export default packagesRouter
