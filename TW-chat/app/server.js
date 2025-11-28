const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const PORT = process.env.PORT || 5002;
const HEALTH_PORT = 81;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Static
app.use('/style', express.static(path.join(__dirname, 'style')));
app.use('/static', express.static(path.join(__dirname, 'static')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'index.html'));
});

// Health check on separate port
const healthApp = express();
healthApp.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'tw-chat',
    timestamp: new Date().toISOString()
  });
});

healthApp.listen(HEALTH_PORT, () => {
  console.log(`[CHAT] Health check listening on port ${HEALTH_PORT}`);
});

// HTTP server + Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

const users = new Map(); // socket.id -> username

io.on('connection', (socket) => {
  console.log(`[CHAT] Client connected: ${socket.id}`);

  socket.on('join', (username) => {
    const name = (username || '').trim() || `user-${socket.id.substring(0,4)}`;
    users.set(socket.id, name);
    socket.broadcast.emit('system', `${name} se ha unido al chat`);
    socket.emit('system', `Bienvenido, ${name}`);
  });

  socket.on('message', (text) => {
    const name = users.get(socket.id) || 'anónimo';
    const payload = {
      user: name,
      text: String(text || ''),
      time: new Date().toISOString()
    };
    io.emit('message', payload);
  });

  socket.on('disconnect', () => {
    const name = users.get(socket.id);
    if (name) {
      socket.broadcast.emit('system', `${name} salió del chat`);
      users.delete(socket.id);
    }
    console.log(`[CHAT] Client disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`[CHAT] Microfrontend TW-chat running on port ${PORT}`);
});
