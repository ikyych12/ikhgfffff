import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, FileCode, Settings, Play, Square, RotateCw, Send, ChevronRight, Folder, File, HardDrive as FileIcon } from 'lucide-react';
import { clsx } from 'clsx';

function FileList({ serverId }: { serverId: string }) {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFiles = async () => {
    try {
      const res = await axios.get(`/api/servers/${serverId}/files`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setFiles(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchFiles();
  }, [serverId]);

  const deleteFile = async (name: string) => {
    if (!confirm(`Delete ${name}?`)) return;
    try {
      await axios.delete(`/api/servers/${serverId}/files?filename=${name}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchFiles();
    } catch (e) { alert('Delete failed'); }
  };

  if (loading) return <div className="p-8 text-center text-slate-600 font-mono text-[10px] uppercase animate-pulse tracking-[0.2em]">Syncing volume snapshots...</div>;
  if (files.length === 0) return (
    <div className="p-20 text-center flex flex-col items-center">
      <FileCode className="w-12 h-12 text-slate-800 mb-4" />
      <span className="text-slate-600 font-medium italic text-sm">Volume is currently empty.</span>
    </div>
  );

  return (
    <>
      {files.map((file, i) => (
        <div key={i} className="flex items-center justify-between p-5 hover:bg-white/5 transition-all group">
          <div className="flex items-center space-x-4">
            <div className={clsx(
              "w-10 h-10 rounded-xl flex items-center justify-center border border-white/5",
              file.isDir ? "bg-teal-500/10 text-teal-400" : "bg-black/40 text-slate-500"
            )}>
              {file.isDir ? <Folder className="w-5 h-5" /> : <File className="w-5 h-5" />}
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-sm group-hover:text-teal-400 transition-colors uppercase tracking-tight">{file.name}</span>
              <span className="text-[10px] text-slate-600 font-mono uppercase tracking-tighter">
                {file.isDir ? 'Directory' : `${(file.size / 1024).toFixed(1)} KB`}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <button 
              onClick={() => deleteFile(file.name)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-rose-500/50 hover:text-rose-500 uppercase text-[10px] font-black tracking-widest"
            >
              Delete
            </button>
            <button className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-white uppercase text-[10px] font-black tracking-widest">
              Download
            </button>
          </div>
        </div>
      ))}
    </>
  );
}

export default function ManageServer({ user }: { user: any }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [server, setServer] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('console');
  const [logs, setLogs] = useState<string[]>([]);
  const [command, setCommand] = useState('');
  const [isPerformingAction, setIsPerformingAction] = useState(false);
  const socketRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchServer = async () => {
      try {
        const res = await axios.get('/api/servers', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const s = res.data.find((s: any) => s.id === id);
        if (!s) return navigate('/');
        setServer(s);
      } catch (err) { navigate('/'); }
    };
    fetchServer();

    socketRef.current = io();
    socketRef.current.emit('join-server', id);
    socketRef.current.on('logs', (newLogs: string) => {
      setLogs(prev => [...prev, newLogs]);
    });

    return () => socketRef.current.disconnect();
  }, [id, navigate]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const handleAction = async (action: string) => {
    setIsPerformingAction(true);
    try {
      await axios.post(`/api/servers/${id}/action`, { action }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setServer({ ...server, status: action === 'stop' ? 'stopped' : 'running' });
    } catch (e) {
      console.error(e);
    } finally {
      setIsPerformingAction(false);
    }
  };

  const sendCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;
    socketRef.current.emit('command', { serverId: id, command });
    setCommand('');
  };

  if (!server) return null;

  const tabs = [
    { id: 'console', icon: Terminal, name: 'Console' },
    { id: 'files', icon: FileCode, name: 'File Manager' },
    { id: 'settings', icon: Settings, name: 'Settings' }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-4 mb-2">
            <h1 className="text-4xl font-bold tracking-tight">{server.name}<span className="text-teal-500">.</span></h1>
            <span className={clsx(
              "text-[10px] uppercase font-bold tracking-[0.2em] px-3 py-1 rounded-full border flex items-center gap-1.5",
              server.status === 'running' ? "bg-teal-500/10 text-teal-400 border-teal-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"
            )}>
              {server.status === 'running' && <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse" />}
              {server.status}
            </span>
          </div>
          <p className="font-mono text-[10px] text-slate-500 uppercase tracking-widest leading-loose">Node ID: {id} <span className="mx-2 text-slate-800">|</span> Image: {server.image}</p>
        </div>

        <div className="flex items-center gap-3">
          {server.status === 'stopped' ? (
            <button 
              disabled={isPerformingAction}
              onClick={() => handleAction('start')}
              className="px-6 py-3 rounded-2xl bg-teal-500 hover:bg-teal-400 text-black font-bold text-xs uppercase tracking-[0.2em] transition-all flex items-center gap-2 shadow-lg shadow-teal-500/20 active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" /> <span>Start Node</span>
            </button>
          ) : (
            <>
              <button 
                disabled={isPerformingAction}
                onClick={() => handleAction('stop')}
                className="px-6 py-3 rounded-2xl bg-rose-500 hover:bg-rose-400 text-black font-bold text-xs uppercase tracking-[0.2em] transition-all flex items-center gap-2 shadow-lg shadow-rose-500/20 active:scale-95"
              >
                <Square className="w-4 h-4 fill-current" /> <span>Stop</span>
              </button>
              <button 
                disabled={isPerformingAction}
                onClick={() => handleAction('restart')}
                className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-[0.2em] transition-all flex items-center gap-2 active:scale-95"
              >
                <RotateCw className="w-4 h-4" /> <span>Restart</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 p-1 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              "flex items-center space-x-3 px-6 py-3 rounded-xl font-bold text-[10px] uppercase tracking-[0.2em] transition-all",
              activeTab === tab.id ? "bg-teal-500 text-black shadow-lg shadow-teal-500/20" : "text-slate-400 hover:text-slate-200"
            )}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.name}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl min-h-[550px] flex flex-col relative overflow-hidden shadow-2xl">
        <AnimatePresence mode="wait">
          {activeTab === 'console' && (
            <motion.div 
              key="console"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col p-8"
            >
              <div 
                ref={scrollRef}
                className="flex-1 bg-black/60 rounded-2xl p-6 font-mono text-[13px] overflow-y-auto mb-6 border border-white/5 h-[400px] whitespace-pre-wrap selection:bg-teal-500 selection:text-black leading-relaxed"
              >
                {logs.length === 0 ? (
                  <span className="text-slate-700 italic lowercase tracking-wider opacity-50">Establishing secure TTY connection...</span>
                ) : (
                  <span className="text-teal-400/90 drop-shadow-[0_0_8px_rgba(20,184,166,0.2)]">{logs.join('')}</span>
                )}
              </div>
              
              <form onSubmit={sendCommand} className="relative group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <span className="text-teal-500 font-black text-sm">root@node:~$</span>
                </div>
                <input 
                  type="text"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  placeholder="Enter secure command..."
                  disabled={server.status !== 'running'}
                  className="w-full bg-black/40 border border-white/5 rounded-2xl h-16 pl-36 pr-16 font-mono text-sm outline-none focus:border-teal-500/30 transition-all disabled:opacity-30 placeholder:text-slate-700"
                />
                <button 
                  type="submit"
                  disabled={server.status !== 'running'}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-teal-500 hover:text-teal-400 disabled:opacity-30 transition-all"
                >
                  <Send className="w-5 h-5" />
                </button>
                <div className="absolute right-0 bottom-0 top-0 w-24 bg-gradient-to-l from-teal-500/5 pointer-events-none rounded-r-2xl" />
              </form>
            </motion.div>
          )}

          {activeTab === 'files' && (
            <motion.div 
              key="files"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 p-8"
            >
              <div className="bg-black/40 border border-white/5 rounded-2xl overflow-hidden">
                <div className="bg-white/5 p-5 border-b border-white/5 flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-500">Persistent Storage Volume</span>
                  <div className="flex items-center gap-4 text-[10px] text-slate-600 font-mono">
                    <span>MOUNT: /home/container</span>
                    <span>SIZE: {server.storage}GB</span>
                  </div>
                </div>
                <div className="divide-y divide-white/5">
                  <FileList serverId={id!} />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div 
              key="settings"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 p-10"
            >
              <div className="max-w-2xl space-y-10">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500 mb-8 flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-teal-500 rounded-full" />
                    Resource Provisioning
                  </h3>
                  <div className="grid grid-cols-2 gap-10">
                    <div className="space-y-3">
                            <label className="text-[10px] text-slate-600 uppercase font-black tracking-widest ml-1">vCPU Cores</label>
                            <div className="bg-black/40 border border-white/5 rounded-2xl p-4 font-mono text-sm text-slate-300">
                              {server.cpu} Cores
                            </div>
                    </div>
                    <div className="space-y-3">
                            <label className="text-[10px] text-slate-600 uppercase font-black tracking-widest ml-1">Allocated Memory</label>
                            <div className="bg-black/40 border border-white/5 rounded-2xl p-4 font-mono text-sm text-slate-300">
                              {server.ram} MB
                            </div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-10 border-t border-white/5">
                  <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-rose-500/60 mb-6">Decommissioning</h3>
                  <button className="bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-black border border-rose-500/20 px-8 py-4 rounded-2xl font-bold uppercase text-[10px] tracking-[0.2em] transition-all active:scale-95">
                    Destroy Node Artifacts
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
