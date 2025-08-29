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
    <div>
      <header style={{ padding:12, background:'#111827', color:'white' }}>
        <strong>Tablero de Pedidos</strong>
      </header>
      <div className="container" style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16, padding:16 }}>
        <DragDropContext onDragEnd={onDragEnd}>
          {columns.map(col => (
            <Droppable droppableId={col.id} key={col.id}>
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:8, minHeight:400, padding:12 }}>
                  <h3 style={{ marginTop:0 }}>{col.title}</h3>
                  {(grouped[col.id] || []).map((o, idx) => (
                    <Draggable draggableId={o.id} index={idx} key={o.id}>
                      {(provided2) => (
                        <div ref={provided2.innerRef} {...provided2.draggableProps} {...provided2.dragHandleProps}
                          style={{ userSelect:'none', padding:12, marginBottom:8, border:'1px solid #e5e7eb', borderRadius:8, background: o.color || '#f9fafb', ...provided2.draggableProps.style }}>
                          <div style={{ display:'flex', justifyContent:'space-between' }}>
                            <strong>{o.title}</strong>
                            <small>{new Date(o.createdAt).toLocaleTimeString()}</small>
                          </div>
                          {o.details && <div style={{ color:'#4b5563', marginTop:6 }}>{o.details}</div>}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </DragDropContext>
      </div>
    </div>
  );
}
