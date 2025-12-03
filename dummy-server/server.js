const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ============ MOCK DATA ============

// Sales data
const salesData = [
  { id: 1, product: 'Widget A', revenue: 15000, units: 150, date: '2025-12-01', region: 'North' },
  { id: 2, product: 'Widget B', revenue: 22500, units: 225, date: '2025-12-01', region: 'South' },
  { id: 3, product: 'Gadget X', revenue: 8700, units: 87, date: '2025-12-02', region: 'East' },
  { id: 4, product: 'Gadget Y', revenue: 31200, units: 312, date: '2025-12-02', region: 'West' },
  { id: 5, product: 'Widget A', revenue: 18500, units: 185, date: '2025-12-03', region: 'North' },
];

// Customer metrics
const customerMetrics = [
  { id: 1, metric: 'Active Users', value: 12543, change: 5.2, period: 'daily' },
  { id: 2, metric: 'New Signups', value: 847, change: 12.1, period: 'daily' },
  { id: 3, metric: 'Churn Rate', value: 2.3, change: -0.5, period: 'monthly' },
  { id: 4, metric: 'NPS Score', value: 72, change: 3, period: 'quarterly' },
  { id: 5, metric: 'Support Tickets', value: 156, change: -8.3, period: 'daily' },
];

// Financial KPIs
const financialKPIs = [
  { id: 1, name: 'Monthly Revenue', value: 125000, currency: 'NOK', target: 150000 },
  { id: 2, name: 'Gross Margin', value: 42.5, currency: '%', target: 45 },
  { id: 3, name: 'Operating Costs', value: 72000, currency: 'NOK', target: 70000 },
  { id: 4, name: 'Net Profit', value: 53000, currency: 'NOK', target: 60000 },
  { id: 5, name: 'Cash Flow', value: 89000, currency: 'NOK', target: 80000 },
];

// Employee stats
const employeeStats = [
  { id: 1, department: 'Engineering', headcount: 45, avgSalary: 850000, satisfaction: 4.2 },
  { id: 2, department: 'Sales', headcount: 28, avgSalary: 720000, satisfaction: 3.9 },
  { id: 3, department: 'Marketing', headcount: 15, avgSalary: 680000, satisfaction: 4.1 },
  { id: 4, department: 'Support', headcount: 22, avgSalary: 550000, satisfaction: 3.7 },
  { id: 5, department: 'HR', headcount: 8, avgSalary: 620000, satisfaction: 4.4 },
];

// ============ ENDPOINTS ============

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API info endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Dummy Data Server',
    version: '1.0.0',
    endpoints: [
      { path: '/api/sales', description: 'Sales data with revenue and units' },
      { path: '/api/customers', description: 'Customer metrics and KPIs' },
      { path: '/api/financial', description: 'Financial KPIs and targets' },
      { path: '/api/employees', description: 'Employee statistics by department' },
    ],
    authentication: {
      type: 'bearer',
      testToken: 'test-token-123',
      note: 'Use Authorization: Bearer test-token-123 header',
    },
  });
});

// Middleware to check auth (optional - set REQUIRE_AUTH=true to enable)
const authMiddleware = (req, res, next) => {
  if (process.env.REQUIRE_AUTH === 'true') {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== 'Bearer test-token-123') {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or missing token' });
    }
  }
  next();
};

// Sales endpoint
app.get('/api/sales', authMiddleware, (req, res) => {
  const { region, limit } = req.query;
  let data = [...salesData];
  
  if (region) {
    data = data.filter(item => item.region.toLowerCase() === region.toLowerCase());
  }
  if (limit) {
    data = data.slice(0, parseInt(limit));
  }
  
  res.json({
    data,
    total: data.length,
    timestamp: new Date().toISOString(),
  });
});

// Customer metrics endpoint
app.get('/api/customers', authMiddleware, (req, res) => {
  const { period } = req.query;
  let data = [...customerMetrics];
  
  if (period) {
    data = data.filter(item => item.period === period);
  }
  
  res.json({
    data,
    total: data.length,
    timestamp: new Date().toISOString(),
  });
});

// Financial KPIs endpoint
app.get('/api/financial', authMiddleware, (req, res) => {
  res.json({
    data: financialKPIs,
    total: financialKPIs.length,
    summary: {
      totalRevenue: financialKPIs.find(k => k.name === 'Monthly Revenue')?.value,
      netProfit: financialKPIs.find(k => k.name === 'Net Profit')?.value,
    },
    timestamp: new Date().toISOString(),
  });
});

// Employee stats endpoint
app.get('/api/employees', authMiddleware, (req, res) => {
  const { department } = req.query;
  let data = [...employeeStats];
  
  if (department) {
    data = data.filter(item => item.department.toLowerCase() === department.toLowerCase());
  }
  
  res.json({
    data,
    total: data.length,
    totalHeadcount: data.reduce((sum, d) => sum + d.headcount, 0),
    timestamp: new Date().toISOString(),
  });
});

// Generic data endpoint (for testing custom paths)
app.get('/api/data/:type', authMiddleware, (req, res) => {
  const { type } = req.params;
  const datasets = {
    sales: salesData,
    customers: customerMetrics,
    financial: financialKPIs,
    employees: employeeStats,
  };
  
  const data = datasets[type];
  if (!data) {
    return res.status(404).json({ error: 'Not found', availableTypes: Object.keys(datasets) });
  }
  
  res.json({ data, total: data.length, timestamp: new Date().toISOString() });
});

// POST endpoint for testing
app.post('/api/submit', authMiddleware, (req, res) => {
  console.log('Received data:', req.body);
  res.json({
    success: true,
    received: req.body,
    timestamp: new Date().toISOString(),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🎯 Dummy Data Server running on http://localhost:${PORT}`);
  console.log(`📊 Available endpoints:`);
  console.log(`   GET  /api/sales      - Sales data`);
  console.log(`   GET  /api/customers  - Customer metrics`);
  console.log(`   GET  /api/financial  - Financial KPIs`);
  console.log(`   GET  /api/employees  - Employee stats`);
  console.log(`\n🔑 Test token: test-token-123`);
});
