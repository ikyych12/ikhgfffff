import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ManageServer from './pages/ManageServer';
import Admin from './pages/Admin';
import Navbar from './components/layout/Navbar';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  if (loading) return null;

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#0c0e14] text-slate-100 selection:bg-teal-500/30 relative overflow-x-hidden">
        <div className="fixed inset-0 bg-gradient-to-tr from-teal-500/[0.03] via-transparent to-purple-500/[0.03] pointer-events-none" />
        {user && <Navbar user={user} onLogout={() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }} />}
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/login" element={user ? <Navigate to="/" /> : <Login onLogin={setUser} />} />
            <Route path="/" element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} />
            <Route path="/server/:id" element={user ? <ManageServer user={user} /> : <Navigate to="/login" />} />
            <Route path="/admin" element={user?.role === 'admin' ? <Admin /> : <Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
