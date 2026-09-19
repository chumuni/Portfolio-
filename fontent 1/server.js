const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');

const app = express();
const PORT = Number(process.env.PORT) || 5001;
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_DB;
const jwtSecret = process.env.JWT_SECRET;

// Middleware
app.use(cors({ origin: ['http://localhost:5500', 'http://127.0.0.1:5500'] }));
app.use(express.json());

// Database connection
if (!mongoUri || !jwtSecret) {
  console.error('Server configuration error: MONGODB_URI and JWT_SECRET must be configured');
  process.exit(1);
}

// Routes
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({ status: connected ? 'ok' : 'unavailable' });
});

async function startServer() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
}

startServer();
