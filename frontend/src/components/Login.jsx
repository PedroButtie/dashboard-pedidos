import React, { useState } from 'react';
import { login } from '../api.js';

export default function Login({ onLogged }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setError(null);
    try {
      const user = await login(username, password);
      onLogged(user);
    } catch (e) {
      setError('Credenciales inválidas');
    }
  }

  return (
    <div style={{ display:'grid', placeItems:'center', height:'100vh' }}>
      <form onSubmit={submit} style={{ width:320, padding:24, border:'1px solid #e5e7eb', borderRadius:8, background:'white' }}>
        <h2 style={{ marginTop:0, marginBottom:16 }}>Ingresar</h2>
        <label>Usuario</label>
        <input value={username} onChange={e=>setUsername(e.target.value)} style={{ width:'100%', padding:8, marginBottom:12 }} />
        <label>Contraseña</label>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} style={{ width:'100%', padding:8, marginBottom:12 }} />
        {error && <div style={{ color:'white', background:'#ef4444', padding:'8px 12px', borderRadius:6, marginBottom:12 }}>{error}</div>}
        <button type="submit" style={{ width:'100%', padding:10, cursor:'pointer' }}>Entrar</button>
        <p style={{ fontSize:12, color:'#6b7280', marginTop:12 }}>Usuarios de demo: admin/admin123, operario/operario123</p>
      </form>
    </div>
  );
}
