import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { motion } from 'motion/react';
import { Server, Activity, ArrowRight, HardDrive, Cpu, MemoryStick as Memory } from 'lucide-react';
import { clsx } from 'clsx';

export default function Dashboard({ user }: { user: any }) {
  const [servers, setServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServers = async () => {
      try {
        const res = await api.get('/api/servers');
        setServers(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchServers();
  }, []);

  if (loading) return <div className="animate-pulse font-mono flex items-center justify-center h-[50vh]">Scanning infrastructure...</div>;

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Systems Overview<span className="text-teal-500">.</span></h1>
        <p className="text-slate-500 font-medium text-xs uppercase tracking-[0.2em]">Active infrastructure nodes for {user.username}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {servers.map((server) => (
          <ServerCard key={server.id} server={server} />
        ))}
        {servers.length === 0 && (
          <div className="col-span-full border border-white/5 bg-white/5 backdrop-blur-xl rounded-3xl p-20 text-center text-slate-500 font-medium italic">
            No active nodes. Contact administrator to assign resources.
          </div>
        )}
      </div>
    </div>
  );
}

function ServerCard({ server }: any) {
  const [stats, setStats] = useState({ cpu: 0, ram: 0 });

  useEffect(() => {
    if (server.status !== 'running') return;
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/api/servers/${server.id}/stats`);
        setStats(res.data);
      } catch (e) {
        // ignore
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [server.id, server.status]);

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative overflow-hidden group shadow-xl"
    >
      <div className="flex justify-between items-start mb-8">
        <div className="bg-black/40 p-3 rounded-2xl border border-white/5 text-teal-400">
          <Server className={clsx("w-6 h-6", server.status === 'running' ? "opacity-100" : "opacity-30")} />
        </div>
        <div className="flex flex-col items-end">
          <span className={clsx(
            "text-[10px] uppercase font-bold tracking-[0.2em] px-3 py-1 rounded-full border flex items-center gap-1.5",
            server.status === 'running' 
              ? "bg-teal-500/10 text-teal-400 border-teal-500/20" 
              : "bg-rose-500/10 text-rose-400 border-rose-500/20"
          )}>
            {server.status === 'running' && <span className="w-1 h-1 bg-teal-400 rounded-full animate-pulse" />}
            {server.status}
          </span>
          <span className="text-[10px] font-mono text-slate-500 mt-2 uppercase tracking-tighter">ID: {server.id}</span>
        </div>
      </div>

      <h3 className="text-xl font-bold tracking-tight mb-8 group-hover:text-teal-400 transition-colors">
        {server.name}
      </h3>

      <div className="grid grid-cols-3 gap-6 mb-10">
        <div className="space-y-2">
          <div className="flex items-center space-x-1.5 text-slate-500">
            <Cpu className="w-3.5 h-3.5 text-teal-500" />
            <span className="text-[10px] uppercase font-bold tracking-widest">CPU</span>
          </div>
          <p className="text-sm font-mono font-bold">{stats.cpu.toFixed(1)}%</p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center space-x-1.5 text-slate-500">
            <Memory className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[10px] uppercase font-bold tracking-widest">RAM</span>
          </div>
          <p className="text-sm font-mono font-bold">{stats.ram.toFixed(0)}MB</p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center space-x-1.5 text-slate-500">
            <HardDrive className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[10px] uppercase font-bold tracking-widest">DISK</span>
          </div>
          <p className="text-sm font-mono font-bold">{server.storage}GB</p>
        </div>
      </div>

      <Link 
        to={`/server/${server.id}`}
        className="w-full h-14 flex items-center justify-between px-6 bg-white/5 hover:bg-teal-500 border border-white/10 text-slate-100 hover:text-black transition-all rounded-2xl font-bold uppercase text-[10px] tracking-[0.2em] group"
      >
        <span>Manage System</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </Link>

      <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 blur-[80px] rounded-full pointer-events-none" />
    </motion.div>
  );
}
