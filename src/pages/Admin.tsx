import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'motion/react';
import { UserPlus, Plus, Users, Database, ShieldCheck, Key } from 'lucide-react';
import { clsx } from 'clsx';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('nodes');
  const [users, setUsers] = useState<any[]>([]);
  const [servers, setServers] = useState<any[]>([]);
  
  // Forms
  const [userForm, setUserForm] = useState({ username: '', password: '', role: 'user' });
  const [serverForm, setServerForm] = useState({ name: '', owner_id: '', image: 'ubuntu:22.04', cpu: 0.5, ram: 512, storage: 10 });

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
      const [uRes, sRes] = await Promise.all([
        axios.get('/api/admin/users', { headers }),
        axios.get('/api/servers', { headers })
      ]);
      setUsers(uRes.data);
      setServers(sRes.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchData(); }, []);

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/users', userForm, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setUserForm({ username: '', password: '', role: 'user' });
      fetchData();
    } catch (e) { alert('Failed to create user'); }
  };

  const createServer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/servers', serverForm, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setServerForm({ name: '', owner_id: '', image: 'ubuntu:22.04', cpu: 0.5, ram: 512, storage: 10 });
      fetchData();
    } catch (e) { alert('Failed to create server'); }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Internal Control Panel<span className="text-teal-500">.</span></h1>
          <p className="text-slate-500 font-medium text-[10px] uppercase tracking-[0.2em]">Global resource & personnel monitoring</p>
        </div>
        <div className="flex space-x-1 p-1 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
          <button 
            onClick={() => setActiveTab('nodes')}
            className={clsx("px-6 py-2.5 font-bold text-[10px] uppercase tracking-[0.2em] rounded-xl transition-all", activeTab === 'nodes' ? "bg-teal-500 text-black shadow-lg shadow-teal-500/20" : "text-slate-500 hover:text-slate-300")}
          >
            Infrastructure
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={clsx("px-6 py-2.5 font-bold text-[10px] uppercase tracking-[0.2em] rounded-xl transition-all", activeTab === 'users' ? "bg-teal-500 text-black shadow-lg shadow-teal-500/20" : "text-slate-500 hover:text-slate-300")}
          >
            Personnel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Forms column */}
        <div className="lg:col-span-4 space-y-6">
          {activeTab === 'users' ? (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl relative overflow-hidden group">
              <div className="absolute -top-12 -right-12 w-24 h-24 bg-teal-500/5 blur-[40px] rounded-full" />
              <div className="flex items-center space-x-3 mb-8">
                <div className="w-8 h-8 bg-teal-500/10 rounded-lg flex items-center justify-center text-teal-400 border border-teal-500/20">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h2 className="font-bold text-xs uppercase tracking-[0.2em]">Enlist personnel</h2>
              </div>
              <form onSubmit={createUser} className="space-y-4">
                <input placeholder="Username" value={userForm.username} onChange={e => setUserForm({...userForm, username: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 font-mono text-sm outline-none focus:border-teal-500/30 transition-all" />
                <input type="password" placeholder="Password" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 font-mono text-sm outline-none focus:border-teal-500/30 transition-all" />
                <select value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 font-mono text-sm outline-none focus:border-teal-500/30 transition-all appearance-none cursor-pointer">
                  <option value="user">Role: USER</option>
                  <option value="admin">Role: ADMIN</option>
                </select>
                <button type="submit" className="w-full bg-teal-500 hover:bg-teal-400 text-black font-bold py-4 rounded-2xl uppercase tracking-widest text-[10px] transition-all shadow-lg shadow-teal-500/20 active:scale-95">Confirm Enlistment</button>
              </form>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl relative overflow-hidden group">
              <div className="absolute -top-12 -right-12 w-24 h-24 bg-teal-500/5 blur-[40px] rounded-full" />
              <div className="flex items-center space-x-3 mb-8">
                <div className="w-8 h-8 bg-teal-500/10 rounded-lg flex items-center justify-center text-teal-400 border border-teal-500/20">
                  <Plus className="w-4 h-4" />
                </div>
                <h2 className="font-bold text-xs uppercase tracking-[0.2em]">Commission Node</h2>
              </div>
              <form onSubmit={createServer} className="space-y-4">
                <input placeholder="Node Identifier" value={serverForm.name} onChange={e => setServerForm({...serverForm, name: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 font-mono text-sm outline-none focus:border-teal-500/30 transition-all" />
                <select value={serverForm.owner_id} onChange={e => setServerForm({...serverForm, owner_id: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 font-mono text-sm outline-none focus:border-teal-500/30 transition-all italic">
                  <option value="">Select Assignee</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase font-bold text-slate-600 tracking-widest ml-1">vCPU Limit</label>
                    <input type="number" step="0.1" value={serverForm.cpu} onChange={e => setServerForm({...serverForm, cpu: parseFloat(e.target.value)})} className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 font-mono text-sm outline-none focus:border-teal-500/30" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase font-bold text-slate-600 tracking-widest ml-1">RAM (MB)</label>
                    <input type="number" value={serverForm.ram} onChange={e => setServerForm({...serverForm, ram: parseInt(e.target.value)})} className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 font-mono text-sm outline-none focus:border-teal-500/30" />
                  </div>
                </div>
                <input placeholder="Docker Image Reference" value={serverForm.image} onChange={e => setServerForm({...serverForm, image: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 font-mono text-sm outline-none focus:border-teal-500/30 transition-all" />
                <button type="submit" className="w-full bg-teal-500 hover:bg-teal-400 text-black font-bold py-4 rounded-2xl uppercase tracking-widest text-[10px] transition-all shadow-lg shadow-teal-500/20 active:scale-95">Initiate Deployment</button>
              </form>
            </motion.div>
          )}
        </div>

        {/* Listings column */}
        <div className="lg:col-span-8">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
            {activeTab === 'users' ? (
              <table className="w-full text-left font-sans text-xs">
                <thead className="bg-white/5 uppercase tracking-[0.2em] text-slate-500 font-bold border-b border-white/5">
                  <tr>
                    <th className="px-6 py-5">Personnel</th>
                    <th className="px-6 py-5">Authorization</th>
                    <th className="px-6 py-5">API Access Protocol</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-white/5 group-hover:border-teal-500/50 transition-colors">
                            <Users className="w-4 h-4 text-slate-600" />
                          </div>
                          <span className="font-bold text-slate-200">{u.username}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={clsx("text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border", u.role === 'admin' ? "border-teal-500/20 text-teal-400 bg-teal-500/5" : "border-white/10 text-slate-500")}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center space-x-3 text-slate-600 font-mono">
                          <Key className="w-3.5 h-3.5 opacity-30" />
                          <code className="bg-black/40 px-3 py-1.5 rounded-xl border border-white/5 text-[10px] group-hover:text-teal-400 transition-colors uppercase tracking-widest">{u.api_key.substring(0, 8)}••••••••</code>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left font-sans text-xs">
                <thead className="bg-white/5 uppercase tracking-[0.2em] text-slate-500 font-bold border-b border-white/5">
                  <tr>
                    <th className="px-6 py-5">Node Node</th>
                    <th className="px-6 py-5">Hardware Specs</th>
                    <th className="px-6 py-5">Live Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {servers.map(s => (
                    <tr key={s.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-200 text-sm group-hover:text-teal-400 transition-colors uppercase italic">{s.name}</span>
                          <span className="text-[10px] text-slate-600 group-hover:text-slate-500 transition-colors font-mono">NODE_HASH: {s.id}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center space-x-6 font-mono text-[11px] text-slate-400">
                          <div className="flex items-center space-x-2">
                            <Database className="w-3.5 h-3.5 text-purple-500/50" /> 
                            <span>{s.ram}MB</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <ShieldCheck className="w-3.5 h-3.5 text-teal-500/50" /> 
                            <span>{s.cpu} vCo</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={clsx(
                          "text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border flex items-center gap-2 w-fit",
                          s.status === 'running' ? "border-teal-500/20 text-teal-400 bg-teal-500/5" : "border-rose-500/20 text-rose-400 bg-rose-500/5"
                        )}>
                          {s.status === 'running' && <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />}
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
