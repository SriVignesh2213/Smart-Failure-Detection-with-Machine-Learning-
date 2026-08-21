import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Cpu, Plus, Trash2, Activity, MapPin, Tag, ShieldCheck, AlertTriangle } from 'lucide-react';

interface Machine {
  _id: string;
  name: string;
  type: string;
  serial_number: string;
  location: string;
  status: string;
  created_at: string;
}

const MachineList: React.FC = () => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchMachines = async () => {
    try {
      const res = await api.get('/machines');
      setMachines(res.data);
    } catch (err) {
      console.error('Failed to fetch machines', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMachines();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this machine asset?')) return;
    try {
      await api.delete(`/machines/${id}`);
      setMachines(machines.filter((m) => m._id !== id));
    } catch (err) {
      console.error('Failed to delete machine', err);
    }
  };

  const filteredMachines = machines.filter((m) => {
    if (filter === 'all') return true;
    return m.status === filter;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            Machine Asset Inventory
          </h1>
          <p className="text-xs text-slate-400 mt-1">Manage factory equipment, serial tags, and operational health</p>
        </div>

        <Link
          to="/add-machine"
          className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors flex items-center gap-2 self-start sm:self-auto shadow-lg shadow-cyan-500/10"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Asset</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        {['all', 'healthy', 'warning', 'critical'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
              filter === tab
                ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab} {tab !== 'all' && `(${machines.filter((m) => m.status === tab).length})`}
          </button>
        ))}
      </div>

      {/* Loading Skeletons */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-xl bg-slate-900/60 border border-slate-800 animate-pulse"></div>
          ))}
        </div>
      )}

      {/* Machine Cards Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMachines.map((machine) => (
            <div key={machine._id} className="glass-card p-5 rounded-2xl flex flex-col justify-between relative group">
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-base text-slate-100 group-hover:text-cyan-400 transition-colors">
                      {machine.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">{machine.serial_number}</p>
                  </div>
                  {/* Status Badge */}
                  {machine.status === 'critical' ? (
                    <span className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Critical
                    </span>
                  ) : machine.status === 'warning' ? (
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Warning
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Healthy
                    </span>
                  )}
                </div>

                {/* Machine Info */}
                <div className="mt-4 space-y-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-slate-500" />
                    <span>Variant Type: <strong className="text-slate-200">Type {machine.type}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>Location: <strong className="text-slate-200">{machine.location}</strong></span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <Link
                  to={`/predict?machine_id=${machine._id}`}
                  className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Run Diagnostics</span>
                </Link>

                <button
                  onClick={() => handleDelete(machine._id)}
                  className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Delete Machine"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {filteredMachines.length === 0 && (
            <div className="col-span-full glass-panel p-12 text-center rounded-2xl">
              <Cpu className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-400">No machine assets found matching filter.</p>
              <Link to="/add-machine" className="mt-3 inline-block text-xs font-bold text-cyan-400 hover:underline">
                Register a new machine asset
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MachineList;
