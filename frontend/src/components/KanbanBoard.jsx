import React, { useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { updateOrderStatus } from '../api.js';

const columns = [
  { id: 'incoming', title: 'Pedidos Entrantes' },
  { id: 'preparing', title: 'En Preparación' },
  { id: 'delivered', title: 'Entregados' }
];

export default function KanbanBoard({ orders, setOrders }) {
  const grouped = useMemo(() => ({
    incoming: orders.filter(o => o.status === 'incoming'),
    preparing: orders.filter(o => o.status === 'preparing'),
    delivered: orders.filter(o => o.status === 'delivered'),
  }), [orders]);

  async function onDragEnd(result) {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId;
    // Optimistic update
    setOrders(prev => prev.map(o => o.id === draggableId ? { ...o, status: newStatus } : o));
    try {
      await updateOrderStatus(draggableId, newStatus);
    } catch (e) {
      // Rollback if needed
      setOrders(prev => prev.map(o => o.id === draggableId ? { ...o, status: source.droppableId } : o));
      alert('No se pudo actualizar el estado');
    }
  }

  return (
<div
  ref={provided2.innerRef}
  {...provided2.draggableProps}
  {...provided2.dragHandleProps}
  style={{
    userSelect: 'none',
    padding: 12,
    marginBottom: 8,
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    background: o.color || '#f9fafb',
    ...provided2.draggableProps.style
  }}
>
  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
    <strong>{o.title}</strong>
    <small>{new Date(o.createdAt).toLocaleTimeString()}</small>
  </div>

  {/* Cliente */}
  {o.cliente && (
    <div style={{ marginTop: 6 }}>
      <strong>Cliente:</strong> {o.cliente}
    </div>
  )}

  {/* Monto */}
  {o.monto !== undefined && (
    <div style={{ marginTop: 4 }}>
      <strong>Monto:</strong> ${o.monto}
    </div>
  )}

  {/* Productos */}
  {o.productos && o.productos.length > 0 && (
    <div style={{ marginTop: 6 }}>
      <strong>Productos:</strong>
      <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
        {o.productos.map((p, i) => (
          <li key={i}>
            {p.nombre} x {p.cantidad}
          </li>
        ))}
      </ul>
    </div>
  )}

  {/* Detalles originales */}
  {o.details && (
    <div style={{ color: '#4b5563', marginTop: 6 }}>{o.details}</div>
  )}
</div>

  );
}
