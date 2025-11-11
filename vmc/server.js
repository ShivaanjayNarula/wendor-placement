import express from 'express';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import { createServer } from 'http';

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Create HTTP server
const server = createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server });

// VMC State
let vendingState = {
  status: 'idle', // 'idle' or 'vending'
  currentItems: [],
  startTime: null,
  timeout: null
};

// Broadcast to all connected WebSocket clients
function broadcast(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // OPEN
      client.send(JSON.stringify(data));
    }
  });
}

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('New WebSocket client connected');
  
  // Send current status to new client
  ws.send(JSON.stringify({
    type: 'status',
    status: vendingState.status,
    items: vendingState.currentItems
  }));

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// POST /vend - Accept item array and simulate vending
app.post('/vend', async (req, res) => {
  const { items } = req.body;

  // Validate input
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid items array. Expected non-empty array of item numbers.'
    });
  }

  // Check if already vending
  if (vendingState.status === 'vending') {
    return res.status(409).json({
      success: false,
      message: 'Vending machine is currently busy',
      currentItems: vendingState.currentItems
    });
  }

  // Update state to vending
  vendingState.status = 'vending';
  vendingState.currentItems = items;
  vendingState.startTime = Date.now();

  // Broadcast status change
  broadcast({
    type: 'status',
    status: 'vending',
    items: items,
    message: 'Vending started'
  });

  // Respond immediately that vending has started
  res.json({
    success: true,
    message: 'Vending started',
    items: items,
    estimatedTime: 5000 // 5 seconds
  });

  // Simulate vending process (5 seconds delay)
  const vendingDelay = 5000;
  
  vendingState.timeout = setTimeout(() => {
    // Complete vending
    vendingState.status = 'idle';
    const vendedItems = [...vendingState.currentItems];
    vendingState.currentItems = [];
    vendingState.startTime = null;
    vendingState.timeout = null;

    // Broadcast completion
    broadcast({
      type: 'vend-complete',
      status: 'idle',
      message: 'Vending completed successfully',
      vendedItems: vendedItems,
      timestamp: new Date().toISOString()
    });

    console.log(`Vending completed for items: ${vendedItems.join(', ')}`);
  }, vendingDelay);
});

// GET /status - Return vending progress
app.get('/status', (req, res) => {
  let response = {
    status: vendingState.status,
    timestamp: new Date().toISOString()
  };

  if (vendingState.status === 'vending') {
    const elapsed = Date.now() - vendingState.startTime;
    response = {
      ...response,
      items: vendingState.currentItems,
      elapsedTime: elapsed,
      message: 'Vending in progress'
    };
  } else {
    response.message = 'Machine is idle';
  }

  res.json(response);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'VMC Mock Server',
    timestamp: new Date().toISOString()
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🤖 VMC Mock Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready for connections`);
  console.log(`\nEndpoints:`);
  console.log(`  POST http://localhost:${PORT}/vend`);
  console.log(`  GET  http://localhost:${PORT}/status`);
  console.log(`  WS   ws://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down VMC Mock Server...');
  if (vendingState.timeout) {
    clearTimeout(vendingState.timeout);
  }
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
