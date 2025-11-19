const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs').promises;

const generateRoutes = require('./routes/generate');
const githubRoutes = require('./routes/github');
const projectRoutes = require('./routes/projects');
const templateRoutes = require('./routes/templates');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_PATH = process.env.DATA_PATH || '/appdata';

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from frontend build
app.use(express.static(path.join(__dirname, '../frontend/build')));

// API Routes
app.use('/api/generate', generateRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/templates', templateRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Initialize data directory
async function initializeDataDirectory() {
  try {
    await fs.mkdir(DATA_PATH, { recursive: true });
    await fs.mkdir(path.join(DATA_PATH, 'projects'), { recursive: true });
    await fs.mkdir(path.join(DATA_PATH, 'temp'), { recursive: true });
    console.log('Data directories initialized');
  } catch (error) {
    console.error('Failed to initialize data directories:', error);
  }
}

// Start server
initializeDataDirectory().then(() => {
  app.listen(PORT, () => {
    console.log(`App Builder server running on port ${PORT}`);
    console.log(`Data path: ${DATA_PATH}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
});
