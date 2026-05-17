import { Link, useLocation } from 'react-router-dom';
import { Shield, LayoutDashboard, Settings, LogOut, Terminal } from 'lucide-react';
import { clsx } from 'clsx';

export default function Navbar({ user, onLogout }: { user: any, onLogout: () => void }) {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    ...(user.role === 'admin' ? [{ name: 'Admin', path: '/admin', icon: Settings }] : []),
  ];

  return (
    <nav className="border-b border-white/5 bg-white/5 backdrop-blur-xl sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center shadow-lg shadow-teal-500/20 group-hover:rotate-12 transition-transform">
              <Shield className="w-5 h-5 text-black" />
            </div>
            <span className="font-sans font-bold text-lg tracking-tight">Pterodactyl<span className="text-teal-400 font-black">.</span></span>
          </Link>

          <div className="flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  "flex items-center space-x-2 text-sm font-medium transition-colors",
                  location.pathname === item.path ? "text-teal-400" : "text-slate-400 hover:text-white"
                )}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            ))}
            
            <button 
              onClick={onLogout}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-xs font-bold uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all flex items-center gap-2"
            >
              <LogOut className="w-3 h-3" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
