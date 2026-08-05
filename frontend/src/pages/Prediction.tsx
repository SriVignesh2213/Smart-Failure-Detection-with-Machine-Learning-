import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { 
  Activity, 
  Cpu, 
  Thermometer, 
  Gauge, 
  RotateCw, 
  Wrench, 
  Tag, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Info,
  HelpCircle
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

interface Machine {
  _id: string;
  name: string;
  type: string;
  serial_number: string;
}

interface PredictionResult {
  _id: string;
  failure_probability: number;
  is_failure: boolean;
  failure_type: string;
  confidence_score: number;
  shap_values: Record<string, number>;
  maintenance_action: string;
}

const Prediction: React.FC = () => {
  const [searchParams] = useSearchParams();
  const machineIdParam = searchParams.get('machine_id');

  const [machines, setMachines] = useState<Machine[]>([]);
  const [selectedMachineId, setSelectedMachineId] = useState(machineIdParam || '');
  const [airTemp, setAirTemp] = useState<number>(298.1);
  const [processTemp, setProcessTemp] = useState<number>(308.6);
  const [rotationalSpeed, setRotationalSpeed] = useState<number>(1500);
  const [torque, setTorque] = useState<number>(40.0);
  const [toolWear, setToolWear] = useState<number>(15);
  const [productType, setProductType] = useState<string>('M');

  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMachines = async () => {
      try {
        const res = await api.get('/machines');
        setMachines(res.data);
        if (res.data.length > 0 && !selectedMachineId) {
          setSelectedMachineId(res.data[0]._id);
          setProductType(res.data[0].type || 'M');
        }
      } catch (err) {
        console.error('Failed to load machines list', err);
      }
    };
    loadMachines();
  }, []);

  // Update product type automatically when machine selection changes
  const handleMachineChange = (id: string) => {
    setSelectedMachineId(id);
    const m = machines.find((item) => item._id === id);
    if (m) {
      setProductType(m.type);
    }
  };

  const getPredictionErrorMessage = (err: any): string => {
    const fieldNames: Record<string, string> = {
      air_temp: 'Air Temp (K)',
      process_temp: 'Process Temp (K)',
      rotational_speed: 'Speed (RPM)',
      torque: 'Torque (Nm)',
      tool_wear: 'Tool Wear (min)',
      product_type: 'Product Type'
    };

    const formatValidationDetail = (detail: any): string => {
      if (Array.isArray(detail)) {
        return detail
          .map((item: any) => {
            const location = Array.isArray(item?.loc) ? item.loc[item.loc.length - 1] : item?.loc;
            const fieldLabel = fieldNames[String(location)] || (typeof location === 'string' ? location : 'Field');
            const message = item?.msg || 'Invalid value';
            return `${fieldLabel}: ${message}`;
          })
          .join(' • ');
      }

      return typeof detail === 'string' ? detail : 'Invalid telemetry input values.';
    };

    if (err?.response?.data) {
      const { detail } = err.response.data;

      if (Array.isArray(detail) || typeof detail === 'string') {
        return formatValidationDetail(detail);
      }

      if (typeof detail?.msg === 'string') {
        return detail.msg;
      }

      if (typeof err.response.data?.message === 'string') {
        return err.response.data.message;
      }
    }

    if (err?.message === 'Network Error') {
      return 'Inference call failed. Verify API connection and model service.';
    }

    return 'Inference call failed. Verify server models.';
  };

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMachineId) {
      setError('Please select a target machine asset.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await api.post('/predict', {
        machine_id: selectedMachineId,
        air_temp: Number(airTemp),
        process_temp: Number(processTemp),
        rotational_speed: Number(rotationalSpeed),
        torque: Number(torque),
        tool_wear: Number(toolWear),
        product_type: productType
      });

      setResult(response.data);
    } catch (err: any) {
      console.error('Prediction request failed', err);
      setError(getPredictionErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Preset sample test scenarios
  const applyPreset = (type: 'normal' | 'overstrain' | 'toolwear' | 'heat') => {
    if (type === 'normal') {
      setAirTemp(298.1); setProcessTemp(308.6); setRotationalSpeed(1500); setTorque(40.0); setToolWear(15);
    } else if (type === 'overstrain') {
      setAirTemp(302.1); setProcessTemp(311.0); setRotationalSpeed(2800); setTorque(75.0); setToolWear(120);
    } else if (type === 'toolwear') {
      setAirTemp(298.5); setProcessTemp(308.9); setRotationalSpeed(1420); setTorque(48.0); setToolWear(230);
    } else if (type === 'heat') {
      setAirTemp(304.2); setProcessTemp(309.0); setRotationalSpeed(1350); setTorque(62.0); setToolWear(90);
    }
  };

  // Convert SHAP dictionary to Recharts array format
  const shapChartData = result?.shap_values
    ? Object.entries(result.shap_values).map(([key, value]) => ({
        name: key.replace('_', ' ').toUpperCase(),
        value: Number((value * 100).toFixed(2)),
        isPositive: value > 0
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          ML Sensor Failure Inference
        </h1>
        <p className="text-xs text-slate-400 mt-1">Input live sensor telemetry parameters to evaluate failure probability and XAI contributions</p>
      </div>

      {/* Preset Quick Actions */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px] mr-1">Telemetry Presets:</span>
        <button onClick={() => applyPreset('normal')} className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg font-medium transition-colors">
          Nominal Normal
        </button>
        <button onClick={() => applyPreset('overstrain')} className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg font-medium transition-colors">
          High Torque Strain
        </button>
        <button onClick={() => applyPreset('toolwear')} className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-red-400 rounded-lg font-medium transition-colors">
          Critical Tool Wear
        </button>
        <button onClick={() => applyPreset('heat')} className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg font-medium transition-colors">
          Heat Dissipation Risk
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Sensor Input Form (5 Cols) */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-2xl h-fit">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            Sensor Telemetry Inputs
          </h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handlePredict} className="space-y-4">
            {/* Machine Selection */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Target Machine Asset</label>
              <select
                value={selectedMachineId}
                onChange={(e) => handleMachineChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-cyan-500/50"
              >
                {machines.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name} ({m.serial_number}) - Type {m.type}
                  </option>
                ))}
                {machines.length === 0 && <option value="">No machines registered</option>}
              </select>
            </div>

            {/* Air Temp & Process Temp */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5 text-cyan-400" /> Air Temp (K)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={airTemp}
                  onChange={(e) => setAirTemp(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-100 text-xs font-mono focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5 text-amber-400" /> Process Temp (K)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={processTemp}
                  onChange={(e) => setProcessTemp(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-100 text-xs font-mono focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>

            {/* Rotational Speed & Torque */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <RotateCw className="w-3.5 h-3.5 text-cyan-400" /> Speed (RPM)
                </label>
                <input
                  type="number"
                  required
                  value={rotationalSpeed}
                  onChange={(e) => setRotationalSpeed(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-100 text-xs font-mono focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-purple-400" /> Torque (Nm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={torque}
                  onChange={(e) => setTorque(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-100 text-xs font-mono focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>

            {/* Tool Wear & Product Type */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Wrench className="w-3.5 h-3.5 text-red-400" /> Tool Wear (min)
                </label>
                <input
                  type="number"
                  required
                  value={toolWear}
                  onChange={(e) => setToolWear(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-100 text-xs font-mono focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-emerald-400" /> Product Type
                </label>
                <select
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-cyan-500/50"
                >
                  <option value="L">L (Low)</option>
                  <option value="M">M (Medium)</option>
                  <option value="H">H (High)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || machines.length === 0}
              className="w-full py-3 mt-3 bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Activity className="w-4 h-4" />
                  <span>Execute Failure Prediction</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Prediction Results & XAI SHAP (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Prediction Status Box */}
          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
            {!result ? (
              <div className="py-16 text-center text-slate-500">
                <HelpCircle className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                <p className="text-sm font-semibold">Awaiting Sensor Parameters</p>
                <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">Fill out the telemetry input form and click "Execute Failure Prediction" to evaluate operational health.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Header Probability Gauge Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Failure Risk Gauge</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-4xl font-extrabold text-slate-100">
                        {(result.failure_probability * 100).toFixed(1)}%
                      </span>
                      <span className="text-xs text-slate-400">Failure Probability</span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {result.failure_probability > 0.8 ? (
                      <div className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-2 neon-glow-red">
                        <ShieldAlert className="w-5 h-5" />
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider">Critical Failure Alert</p>
                          <p className="text-[10px] opacity-80">Immediate Action Required</p>
                        </div>
                      </div>
                    ) : result.is_failure ? (
                      <div className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider">Warning Threshold</p>
                          <p className="text-[10px] opacity-80">Maintenance Urged</p>
                        </div>
                      </div>
                    ) : (
                      <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-2 neon-glow-green">
                        <CheckCircle2 className="w-5 h-5" />
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider">Healthy Operations</p>
                          <p className="text-[10px] opacity-80">Nominal Telemetry</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${
                        result.failure_probability > 0.8 ? 'bg-red-500' : (result.is_failure ? 'bg-amber-500' : 'bg-emerald-500')
                      }`}
                      style={{ width: `${Math.max(result.failure_probability * 100, 3)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Grid details */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Classified Failure Mode</span>
                    <strong className="text-slate-200 mt-1 block">{result.failure_type}</strong>
                  </div>
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Confidence Rating</span>
                    <strong className="text-cyan-400 mt-1 block">{(result.confidence_score * 100).toFixed(1)}% Confidence</strong>
                  </div>
                </div>

                {/* Maintenance Recommendation */}
                <div className="p-4 bg-slate-900/80 rounded-xl border border-cyan-500/20">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">
                    Recommended Maintenance Directive
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed">{result.maintenance_action}</p>
                </div>
              </div>
            )}
          </div>

          {/* SHAP Feature Contribution Chart */}
          {result && (
            <div className="glass-panel p-6 rounded-2xl">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-1 flex items-center gap-2">
                <Info className="w-4 h-4 text-cyan-400" />
                SHAP Explainable AI (XAI) Feature Contributions
              </h3>
              <p className="text-xs text-slate-500 mb-4">Impact of specific sensor variables on failure probability calculation (%)</p>
              
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={shapChartData} layout="vertical">
                    <XAxis type="number" stroke="#64748B" fontSize={10} />
                    <YAxis dataKey="name" type="category" stroke="#94A3B8" fontSize={10} width={130} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '0.75rem' }}
                      formatter={(val: number) => [`${val}%`, 'Contribution Impact']}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {shapChartData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.isPositive ? '#EF4444' : '#10B981'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Prediction;
