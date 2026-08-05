import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import { Bell, Wifi, WifiOff } from 'lucide-react';

const Navbar: React.FC = () => {
  const location = useLocation();
  const [dbConnected, setDbConnected] = useState(true);
  const [alertCount, setAlertCount] = useState(0);

  // Determine page title based on path
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Telemetry Dashboard';
      case '/machines': return 'Machine Asset Management';
      case '/add-machine': return 'Register Machine Asset';
      case '/predict': return 'ML Failure Inference';
      case '/history': return 'Prediction Logs';
      case '/reports': return 'Download Center';
      case '/settings': return 'System Settings';
      default: return 'Predictive Maintenance';
    }
  };

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        // Fetch simple health check or dashboard summaries
        const res = await api.get('/dashboard');
        setDbConnected(true);
        // Calculate alert count based on warning/critical machines
        if (res.data && res.data.summary) {
          setAlertCount(res.data.summary.machines_at_risk || 0);
        }
      } catch (e) {
        console.error('Database/API connection check failed', e);
        setDbConnected(false);
      }
    };
    fetchStatus();
    // Poll every 30 seconds for live updates
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  return (
    <header className="h-16 border-b border-slate-800 bg-industrial-900/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Title */}
      <div>
        <h2 className="text-lg font-semibold text-slate-100">{getPageTitle()}</h2>
      </div>

      {/* Operations Panel */}
      <div className="flex items-center gap-6">
        {/* Status Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/40 border border-slate-800/80">
          {dbConnected ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-widest">Sys Online</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-red-400 animate-pulse" />
              <span className="text-[10px] font-semibold text-red-400 uppercase tracking-widest">Sys Offline</span>
            </>
          )}
        </div>

        {/* Notifications and Alerts */}
        <div className="relative">
          <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50 hover:bg-slate-700/60 transition-colors cursor-pointer">
            <Bell className="w-4.5 h-4.5 text-slate-300" />
            {alertCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center text-[9px] font-bold text-slate-950 neon-glow-cyan border border-industrial-900 animate-bounce">
                {alertCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
