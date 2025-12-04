const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5001;

// ============ MOCK FINANCIAL DATA ============
// Data designed for Rule of 40 calculation:
// Rule of 40 = Growth Rate + EBITDA Margin
// 2024: Growth 25% + EBITDA Margin 15% = 40 ✓

const financialData = {
  2023: {
    revenue: 10000000,      // 10M NOK
    ebitda: 1200000,        // 1.2M NOK (12% margin)
    operatingIncome: 800000,
    depreciation: 200000,
    amortization: 200000,
    costs: 8800000,
    grossProfit: 4000000,
    netProfit: 525000,      // 5.25% drop-through rate
  },
  2024: {
    revenue: 12500000,      // 12.5M NOK (25% growth)
    ebitda: 1875000,        // 1.875M NOK (15% margin)
    operatingIncome: 1375000,
    depreciation: 250000,
    amortization: 250000,
    costs: 10625000,
    grossProfit: 5000000,
    netProfit: 956250,      // 7.65% drop-through rate
  },
  2025: {
    revenue: 15000000,      // 15M NOK (20% growth)
    ebitda: 2550000,        // 2.55M NOK (17% margin)
    operatingIncome: 2050000,
    depreciation: 250000,
    amortization: 250000,
    costs: 12450000,
    grossProfit: 6000000,
    netProfit: 1400000,     // 9.33% drop-through rate
  },
};

// GL Accounts (Chart of Accounts)
const glAccounts = [
  // Revenue accounts (3xxx)
  { dbId: 3000, code: '3000', description: 'Sales Revenue', accountType: 'REVENUE', category: 'Operating Revenue' },
  { dbId: 3010, code: '3010', description: 'Service Revenue', accountType: 'REVENUE', category: 'Operating Revenue' },
  { dbId: 3020, code: '3020', description: 'Subscription Revenue', accountType: 'REVENUE', category: 'Operating Revenue' },
  
  // Cost of Goods Sold (4xxx)
  { dbId: 4000, code: '4000', description: 'Cost of Goods Sold', accountType: 'COGS', category: 'Direct Costs' },
  { dbId: 4010, code: '4010', description: 'Direct Labor', accountType: 'COGS', category: 'Direct Costs' },
  
  // Operating Expenses (5xxx-6xxx)
  { dbId: 5000, code: '5000', description: 'Salaries and Wages', accountType: 'OPEX', category: 'Personnel' },
  { dbId: 5100, code: '5100', description: 'Employee Benefits', accountType: 'OPEX', category: 'Personnel' },
  { dbId: 6000, code: '6000', description: 'Rent and Utilities', accountType: 'OPEX', category: 'Facilities' },
  { dbId: 6100, code: '6100', description: 'Depreciation', accountType: 'DEPRECIATION', category: 'Non-cash' },
  { dbId: 6200, code: '6200', description: 'Amortization', accountType: 'AMORTIZATION', category: 'Non-cash' },
  
  // Calculated accounts
  { dbId: 9000, code: '9000', description: 'EBITDA', accountType: 'EBITDA', category: 'Performance' },
  { dbId: 9100, code: '9100', description: 'Operating Income', accountType: 'OPERATING_INCOME', category: 'Performance' },
];

// Generate transactions for each year
function generateTransactions(year) {
  const data = financialData[year];
  if (!data) return [];
  
  return [
    { dbId: year * 1000 + 1, accountCode: '3000', amount: data.revenue * 0.6, period: `${year}-12`, description: 'Sales Revenue' },
    { dbId: year * 1000 + 2, accountCode: '3010', amount: data.revenue * 0.3, period: `${year}-12`, description: 'Service Revenue' },
    { dbId: year * 1000 + 3, accountCode: '3020', amount: data.revenue * 0.1, period: `${year}-12`, description: 'Subscription Revenue' },
    { dbId: year * 1000 + 4, accountCode: '4000', amount: -data.costs * 0.4, period: `${year}-12`, description: 'Cost of Goods Sold' },
    { dbId: year * 1000 + 5, accountCode: '5000', amount: -data.costs * 0.35, period: `${year}-12`, description: 'Salaries' },
    { dbId: year * 1000 + 6, accountCode: '6000', amount: -data.costs * 0.15, period: `${year}-12`, description: 'Rent and Utilities' },
    { dbId: year * 1000 + 7, accountCode: '6100', amount: -data.depreciation, period: `${year}-12`, description: 'Depreciation' },
    { dbId: year * 1000 + 8, accountCode: '6200', amount: -data.amortization, period: `${year}-12`, description: 'Amortization' },
  ];
}

// ============ GRAPHQL SCHEMA ============
const typeDefs = `#graphql
  type Query {
    # Get aggregated financial summary
    financialSummary(year: Int!, accountType: String): FinancialSummary!
    
    # Get general ledger accounts with optional filtering
    glAccounts(filter: GLAccountFilter): GLAccountConnection!
    
    # Get transactions
    glTransactions(filter: GLTransactionFilter): GLTransactionConnection!
    
    # Company information
    company: Company!
  }

  type Company {
    dbId: Int!
    name: String!
    orgNumber: String!
    currency: String!
  }

  type FinancialSummary {
    total: Float!
    period: String!
    accountType: String!
    currency: String!
    breakdown: [FinancialBreakdownItem!]
  }

  type FinancialBreakdownItem {
    category: String!
    amount: Float!
  }

  input GLAccountFilter {
    year: Int
    accountType: String
    code: String
  }

  type GLAccountConnection {
    edges: [GLAccountEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type GLAccountEdge {
    cursor: String!
    node: GLAccount!
  }

  type GLAccount {
    dbId: Int!
    code: String!
    description: String!
    accountType: String!
    category: String!
    balance: Float
  }

  input GLTransactionFilter {
    year: Int
    accountCode: String
    accountType: String
  }

  type GLTransactionConnection {
    edges: [GLTransactionEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type GLTransactionEdge {
    cursor: String!
    node: GLTransaction!
  }

  type GLTransaction {
    dbId: Int!
    accountCode: String!
    amount: Float!
    period: String!
    description: String!
  }

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }
`;

// ============ RESOLVERS ============
const resolvers = {
  Query: {
    company: () => ({
      dbId: 1,
      name: 'Demo Company AS',
      orgNumber: '123456789',
      currency: 'NOK',
    }),

    financialSummary: (_, { year, accountType }) => {
      const data = financialData[year];
      if (!data) {
        return {
          total: 0,
          period: `${year}`,
          accountType: accountType || 'ALL',
          currency: 'NOK',
          breakdown: [],
        };
      }

      let total = 0;
      let breakdown = [];

      switch (accountType?.toUpperCase()) {
        case 'REVENUE':
          total = data.revenue;
          breakdown = [
            { category: 'Sales Revenue', amount: data.revenue * 0.6 },
            { category: 'Service Revenue', amount: data.revenue * 0.3 },
            { category: 'Subscription Revenue', amount: data.revenue * 0.1 },
          ];
          break;
        case 'EBITDA':
          total = data.ebitda;
          breakdown = [
            { category: 'Operating Income', amount: data.operatingIncome },
            { category: 'Depreciation', amount: data.depreciation },
            { category: 'Amortization', amount: data.amortization },
          ];
          break;
        case 'COSTS':
        case 'OPEX':
          total = data.costs;
          breakdown = [
            { category: 'COGS', amount: data.costs * 0.4 },
            { category: 'Personnel', amount: data.costs * 0.35 },
            { category: 'Facilities', amount: data.costs * 0.15 },
            { category: 'Other', amount: data.costs * 0.1 },
          ];
          break;
        case 'GROSS_PROFIT':
          total = data.grossProfit;
          break;
        case 'OPERATING_INCOME':
          total = data.operatingIncome;
          break;
        case 'NET_PROFIT':
          total = data.netProfit;
          breakdown = [
            { category: 'Operating Income', amount: data.operatingIncome },
            { category: 'Interest & Taxes', amount: data.operatingIncome - data.netProfit },
          ];
          break;
        default:
          // Return all key metrics
          total = data.revenue;
          breakdown = [
            { category: 'Revenue', amount: data.revenue },
            { category: 'EBITDA', amount: data.ebitda },
            { category: 'Costs', amount: data.costs },
          ];
      }

      return {
        total,
        period: `${year}`,
        accountType: accountType || 'ALL',
        currency: 'NOK',
        breakdown,
      };
    },

    glAccounts: (_, { filter }) => {
      let accounts = [...glAccounts];

      if (filter?.accountType) {
        accounts = accounts.filter(a => 
          a.accountType.toUpperCase() === filter.accountType.toUpperCase()
        );
      }

      if (filter?.code) {
        accounts = accounts.filter(a => a.code.includes(filter.code));
      }

      // Add balance based on year
      const year = filter?.year || 2024;
      const data = financialData[year] || financialData[2024];
      
      accounts = accounts.map(account => {
        let balance = 0;
        switch (account.accountType) {
          case 'REVENUE':
            balance = data.revenue / 3; // Simplified
            break;
          case 'EBITDA':
            balance = data.ebitda;
            break;
          case 'COGS':
            balance = data.costs * 0.4;
            break;
          case 'OPEX':
            balance = data.costs * 0.2;
            break;
          case 'DEPRECIATION':
            balance = data.depreciation;
            break;
          case 'AMORTIZATION':
            balance = data.amortization;
            break;
        }
        return { ...account, balance };
      });

      return {
        edges: accounts.map((account, idx) => ({
          cursor: Buffer.from(`account:${account.dbId}`).toString('base64'),
          node: account,
        })),
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: accounts.length > 0 ? Buffer.from(`account:${accounts[0].dbId}`).toString('base64') : null,
          endCursor: accounts.length > 0 ? Buffer.from(`account:${accounts[accounts.length - 1].dbId}`).toString('base64') : null,
        },
        totalCount: accounts.length,
      };
    },

    glTransactions: (_, { filter }) => {
      const year = filter?.year || 2024;
      let transactions = generateTransactions(year);

      if (filter?.accountCode) {
        transactions = transactions.filter(t => t.accountCode === filter.accountCode);
      }

      if (filter?.accountType) {
        const accountCodes = glAccounts
          .filter(a => a.accountType.toUpperCase() === filter.accountType.toUpperCase())
          .map(a => a.code);
        transactions = transactions.filter(t => accountCodes.includes(t.accountCode));
      }

      return {
        edges: transactions.map(tx => ({
          cursor: Buffer.from(`tx:${tx.dbId}`).toString('base64'),
          node: tx,
        })),
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: transactions.length > 0 ? Buffer.from(`tx:${transactions[0].dbId}`).toString('base64') : null,
          endCursor: transactions.length > 0 ? Buffer.from(`tx:${transactions[transactions.length - 1].dbId}`).toString('base64') : null,
        },
        totalCount: transactions.length,
      };
    },
  },
};

// ============ AUTHENTICATION MIDDLEWARE ============
const VALID_TOKEN = 'xledger-test-token-2024';

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  // Allow introspection without auth (for GraphQL Playground)
  if (req.body?.query?.includes('__schema') || req.body?.query?.includes('__type')) {
    return next();
  }

  if (!authHeader) {
    return res.status(401).json({ 
      errors: [{ message: 'Authorization header required', code: 'UNAUTHORIZED' }] 
    });
  }

  const token = authHeader.replace('Bearer ', '').replace('token ', '');
  
  if (token !== VALID_TOKEN) {
    return res.status(401).json({ 
      errors: [{ message: 'Invalid token', code: 'UNAUTHORIZED' }] 
    });
  }

  next();
};

// ============ SERVER SETUP ============
async function startServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true, // Enable GraphQL Playground
  });

  await server.start();

  app.use(cors());
  app.use(express.json());

  // Health check (no auth required)
  app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  // API info
  app.get('/', (req, res) => {
    res.json({
      name: 'Xledger Mock GraphQL Server',
      version: '1.0.0',
      endpoint: '/graphql',
      authentication: {
        type: 'bearer',
        testToken: VALID_TOKEN,
        header: `Authorization: Bearer ${VALID_TOKEN}`,
      },
      availableYears: [2023, 2024, 2025],
      sampleQueries: {
        revenue: 'query { financialSummary(year: 2024, accountType: "REVENUE") { total period } }',
        ebitda: 'query { financialSummary(year: 2024, accountType: "EBITDA") { total period } }',
        ruleOf40: 'Use revenue_2024, revenue_2023, and ebitda_2024 to calculate: ((rev24-rev23)/rev23)*100 + (ebitda24/rev24)*100',
      },
    });
  });

  // GraphQL endpoint with auth
  app.use('/graphql', authMiddleware, expressMiddleware(server));

  app.listen(PORT, () => {
    console.log(`🚀 Xledger Mock Server running at http://localhost:${PORT}`);
    console.log(`📊 GraphQL endpoint: http://localhost:${PORT}/graphql`);
    console.log(`🔑 Test token: ${VALID_TOKEN}`);
    console.log(`\n📈 Rule of 40 data available for years: 2023, 2024, 2025`);
    console.log(`   2024: Growth 25% + EBITDA Margin 15% = 40 ✓`);
  });
}

startServer().catch(console.error);
