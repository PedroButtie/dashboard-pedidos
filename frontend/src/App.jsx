import React, { useEffect, useState } from 'react';
import Login from './components/Login.jsx';
import KanbanBoard from './components/KanbanBoard.jsx';
import { fetchOrders, API_BASE } from './api.js';
import { io } from 'socket.io-client';

export default function App() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const list = await fetchOrders();
      setOrders(list);
    })();
    const s = io(API_BASE, { transports: ['websocket'] });
    s.on('order_created', (o) => {
      setOrders(prev => [o, ...prev]);
    });
    s.on('order_updated', (upd) => {
      setOrders(prev => prev.map(o => o.id === upd.id ? { ...o, ...upd } : o));
    });
    setSocket(s);
    return () => s.disconnect();
  }, [user]);

  if (!user) return <Login onLogged={setUser} />;
  return <KanbanBoard orders={orders} setOrders={setOrders} />;
}
