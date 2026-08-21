import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Cpu, Tag, MapPin, Hash, ArrowLeft, AlertTriangle } from 'lucide-react';

const AddMachine: React.FC = () => {
  const [name, setName] = useState('');
  const [type, setType] = useState('M');
  const [serialNumber, setSerialNumber] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.post('/machines', {
        name,
        type,
        serial_number: serialNumber,
        location,
        status: 'healthy'
      });
      navigate('/machines');
    } catch (err: any) {
      console.error('Failed to create machine', err);
      setError(err.response?.data?.detail || 'Failed to register machine asset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Top bar */}
      <button
        onClick={() => navigate('/machines')}
        className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Machine Inventory</span>
      </button>

      <div className="glass-panel p-8 rounded-2xl relative">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/30">
            <Cpu className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100 uppercase tracking-wider">Register Machine Asset</h1>
            <p className="text-xs text-slate-400">Add a new industrial machine to the ML predictive monitoring roster</p>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Machine Designation Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. CNC Milling Center 04"
              className="w-full px-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Product Type Variant</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Tag className="w-4 h-4" />
                </span>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"
                >
                  <option value="L">L (Low Quality / High Volume)</option>
                  <option value="M">M (Medium Quality)</option>
                  <option value="H">H (High Quality / Premium)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Serial Tag Number</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Hash className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="SN-CNC-8840"
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Floor Location / Bay</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <MapPin className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Assembly Line 2, Bay C"
                className="w-full pl-10 pr-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => navigate('/machines')}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-lg shadow-cyan-500/10 flex items-center justify-center"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Register Asset'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMachine;
