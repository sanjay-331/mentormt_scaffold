import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Login from './pages/Login';

export default function App() {
  return (
    <BrowserRouter>
      <nav className='p-4'>
        <Link to='/' className='mr-4'>Home</Link>
        <Link to='/login'>Login</Link>
      </nav>
      <Routes>
        <Route path='/' element={<div className='p-8'>DATABank (Frontend)<br/>Backend ping: pong</div>} />
        <Route path='/login' element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}
