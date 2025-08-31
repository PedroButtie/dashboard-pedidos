import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import morgan from 'morgan';
import { readDB, writeDB } from './store.js';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();
const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',').map(s => s.trim()) || '*',
    methods: ['GET','POST','PUT','PATCH','DELETE']
  }
});

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';

app.use(express.json());
app.use(morgan('dev'));
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',').map(s => s.trim()) || '*',
  credentials: true
}));

// --- Auth middleware ---
function auth(req, res, next) {
  const hdr = req.headers.authorization;
  if (!hdr) return res.status(401).json({ error: 'Missing Authorization' });
  const [type, token] = hdr.split(' ');
  if (type !== 'Bearer' || !token) return res.status(401).json({ error: 'Invalid Authorization' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// --- Socket.io ---
io.on('connection', (socket) => {
  socket.emit('hello', { ok: true });
});

function broadcast(event, payload) {
  io.emit(event, payload);
}

// --- Routes ---
app.get('/health', (req, res) => res.json({ ok: true }));

// Auth
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  const db = readDB();
  const user = db.users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});

// Orders CRUD (minimal)
app.get('/api/orders', auth, (req, res) => {
  const db = readDB();
  res.json(db.orders);
});

app.post('/api/orders/:id/status', auth, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};
  const db = readDB();
  const order = db.orders.find(o => o.id === id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  order.status = status;
  order.updatedAt = new Date().toISOString();
  writeDB(db);

  // Notify n8n if configured
  try {
    if (process.env.N8N_STATUS_WEBHOOK) {
      await axios.post(process.env.N8N_STATUS_WEBHOOK, { id, status });
    }
  } catch (e) {
    console.error('N8N_STATUS_WEBHOOK error:', e.message);
  }

  broadcast('order_updated', { id, status });

  // If finalized
  if (status === 'delivered' && process.env.N8N_FINALIZE_WEBHOOK) {
    try {
      await axios.post(process.env.N8N_FINALIZE_WEBHOOK, { id, status: 'delivered' });
    } catch (e) {
      console.error('N8N_FINALIZE_WEBHOOK error:', e.message);
    }
  }

  res.json(order);
});

// --- Webhooks from n8n ---
// 1) New incoming order
// 1) New incoming order
app.post('/webhook/order', (req, res) => {
  const { id, title, details, color, cliente, monto, productos } = req.body || {};

  const order = {
    id: id || uuidv4(),
    title: title || 'Pedido',
    details: details || '',
    cliente: cliente || 'Cliente sin nombre',
    monto: monto || 0,
    productos: productos || [], // array [{ nombre, cantidad, precio }]
    status: 'incoming',
    color: color || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const db = readDB();
  db.orders.unshift(order);
  writeDB(db);

  broadcast('order_created', order);
  res.json({ ok: true, order });
});


// 2) Update existing order (e.g., change color or other flags)
// 2) Update existing order
app.post('/webhook/order-update', (req, res) => {
  const { id, color, details, title, cliente, monto, productos } = req.body || {};
  const db = readDB();
  const order = db.orders.find(o => o.id === id);

  if (!order) return res.status(404).json({ error: 'Order not found' });

  if (color !== undefined) order.color = color;
  if (details !== undefined) order.details = details;
  if (title !== undefined) order.title = title;
  if (cliente !== undefined) order.cliente = cliente;
  if (monto !== undefined) order.monto = monto;
  if (productos !== undefined) order.productos = productos;

  order.updatedAt = new Date().toISOString();
  writeDB(db);

  broadcast('order_updated', order);
  res.json({ ok: true, order });
});


server.listen(PORT, () => {
  console.log(`Backend listening on http://0.0.0.0:${PORT}`);
});
