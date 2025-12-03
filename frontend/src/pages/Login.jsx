import React, { useState } from 'react';
import { login as loginService } from '../services/auth';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { setUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await loginService(email, password);
      const token = data?.access_token;
      if (!token) {
        setErr('No token received');
        return;
      }
      // call /me to populate user
      const res = await fetch((import.meta.env.VITE_API_BASE || 'http://localhost:8000/api/v1') + '/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const user = await res.json();
        setUser(user);
        setErr('');
      } else {
        setErr('Login succeeded but failed to fetch profile');
      }
    } catch (e) {
      setErr(e.response?.data?.detail || e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center'>
      <form onSubmit={submit} className='p-6 bg-white rounded shadow'>
        <h2 className='text-lg font-bold mb-4'>Login</h2>
        {err && <div className='text-red-600 mb-2'>{err}</div>}
        <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder='email' className='block mb-2 border p-2' />
        <input value={password} onChange={(e)=>setPassword(e.target.value)} placeholder='password' type='password' className='block mb-4 border p-2' />
        <button disabled={loading} className='px-4 py-2 bg-blue-600 text-white rounded'>
          {loading ? 'Logging...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
