import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { History, Search, Filter } from 'lucide-react';

interface PredictionRecord {
  _id: string;
  machine_id: string;
  sensor_data: {
    air_temp: number;
    process_temp: number;
    rotational_speed: number;
    torque: number;
    tool_wear: number;
    product_type: string;
  };
  failure_probability: number;
  is_failure: boolean;
  failure_type: string;
  confidence_score: number;
  maintenance_action: string;
  created_at: string;
}

const PredictionHistory: React.FC = () => {
  const [history, setHistory] = useState<PredictionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/predict/history');
        setHistory(res.data);
      } catch (err) {
        console.error('Failed to load prediction history', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const filteredHistory = history.filter((item) => {
    const matchesSearch = 
      item.failure_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      strMachineId(item.machine_id).toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'failure') return matchesSearch && item.is_failure;
    if (statusFilter === 'normal') return matchesSearch && !item.is_failure;
    return matchesSearch;
  });

  function strMachineId(id: any) {
    return typeof id === 'string' ? id : (id?.$oid || String(id));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" />
            Prediction Audit Trail
          </h1>
          <p className="text-xs text-slate-400 mt-1">Complete historical log of all machine learning inference runs</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by failure mode or Machine ID..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900/80 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
          >
            <option value="all">All Predictions ({history.length})</option>
            <option value="failure">Failures Flagged ({history.filter(h => h.is_failure).length})</option>
            <option value="normal">Normal Operations ({history.filter(h => !h.is_failure).length})</option>
          </select>
        </div>
      </div>

      {/* History Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-900/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider">
                <th className="py-3.5 px-4 font-semibold">Date & Time</th>
                <th className="py-3.5 px-4 font-semibold">Machine ID</th>
                <th className="py-3.5 px-4 font-semibold">Sensor Variables</th>
                <th className="py-3.5 px-4 font-semibold">Failure Prob</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold">Failure Mode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredHistory.map((item) => (
                <tr key={item._id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-slate-400">
                    {new Date(item.created_at).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-cyan-400">
                    {strMachineId(item.machine_id).slice(-8)}
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">
                    <span className="font-mono text-[11px]">
                      Air:{item.sensor_data.air_temp}K | Proc:{item.sensor_data.process_temp}K | {item.sensor_data.rotational_speed} RPM | {item.sensor_data.torque}Nm | {item.sensor_data.tool_wear}m
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                    {(item.failure_probability * 100).toFixed(1)}%
                  </td>
                  <td className="py-3.5 px-4">
                    {item.failure_probability > 0.8 ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-bold uppercase text-[10px]">
                        Critical
                      </span>
                    ) : item.is_failure ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold uppercase text-[10px]">
                        Warning
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase text-[10px]">
                        Healthy
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">
                    {item.failure_type}
                  </td>
                </tr>
              ))}

              {filteredHistory.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No prediction history logs match criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PredictionHistory;
