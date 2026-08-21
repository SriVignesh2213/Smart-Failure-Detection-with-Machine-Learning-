import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  Activity, 
  Target, 
  TrendingUp, 
  ArrowRight,
  ShieldAlert,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar 
} from 'recharts';

interface DashboardData {
  summary: {
    total_machines: number;
    healthy_machines: number;
    machines_at_risk: number;
    total_predictions: number;
    model_accuracy: number;
    model_name: string;
  };
  recent_predictions: Array<{
    id: string;
    machine_name: string;
    machine_sn: string;
    failure_probability: number;
    is_failure: boolean;
    failure_type: string;
    created_at: string;
  }>;
  status_distribution: Array<{ name: string; value: number; color: string }>;
  prediction_distribution: Array<{ name: string; value: number }>;
  failure_trends: Array<{ date: string; predictions: number; failures: number }>;
  failure_types_breakdown: Array<{ name: string; value: number }>;
}

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/dashboard');
        setData(res.data);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading Skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-slate-900/60 border border-slate-800 animate-pulse"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 rounded-xl bg-slate-900/60 border border-slate-800 animate-pulse"></div>
          <div className="h-80 rounded-xl bg-slate-900/60 border border-slate-800 animate-pulse"></div>
        </div>
      </div>
    );
  }

  const summary = data?.summary || {
    total_machines: 0,
    healthy_machines: 0,
    machines_at_risk: 0,
    total_predictions: 0,
    model_accuracy: 0.985,
    model_name: 'Selected ML Pipeline'
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Quick Action */}
      <div className="glass-card p-6 rounded-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="absolute top-0 right-0 w-96 h-full bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            Industrial Predictive Maintenance Engine
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">v1.0 ML</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Real-time machine failure prediction using multi-sensor telemetry telemetry, SHAP explainable AI, and failure mode diagnostics.
          </p>
        </div>
        <Link
          to="/predict"
          className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2 shrink-0"
        >
          <Activity className="w-4 h-4" />
          <span>New Sensor Test</span>
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Machines */}
        <div className="glass-card p-5 rounded-2xl relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Assets</span>
            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <Cpu className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-100">{summary.total_machines}</span>
            <span className="text-xs text-slate-400">units</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-2">Active factory floor hardware</p>
        </div>

        {/* Card 2: Healthy Machines */}
        <div className="glass-card p-5 rounded-2xl relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Healthy Operational</span>
            <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400">{summary.healthy_machines}</span>
            <span className="text-xs text-slate-400">
              ({summary.total_machines > 0 ? ((summary.healthy_machines / summary.total_machines) * 100).toFixed(0) : 100}%)
            </span>
          </div>
          <p className="text-[10px] text-emerald-500/80 mt-2">Operating within nominal ranges</p>
        </div>

        {/* Card 3: Machines at Risk */}
        <div className="glass-card p-5 rounded-2xl relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Machines at Risk</span>
            <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-400">{summary.machines_at_risk}</span>
            <span className="text-xs text-slate-400">flagged</span>
          </div>
          <p className="text-[10px] text-amber-500/80 mt-2">Warning or critical threshold alerts</p>
        </div>

        {/* Card 4: Model Accuracy */}
        <div className="glass-card p-5 rounded-2xl relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Model Accuracy</span>
            <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
              <Target className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-cyan-400">
              {(summary.model_accuracy * 100).toFixed(1)}%
            </span>
          </div>
          <p className="text-[10px] text-cyan-400/80 mt-2 truncate">{summary.model_name}</p>
        </div>
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Failure Trend Line Chart (2 Cols) */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                Prediction Activity & Failure Trend (7 Days)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Historical telemetry evaluation counts</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.failure_trends || []}>
                <defs>
                  <linearGradient id="colorPredictions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorFailures" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '0.75rem' }}
                  labelStyle={{ color: '#94A3B8' }}
                />
                <Area type="monotone" dataKey="predictions" stroke="#06B6D4" fillOpacity={1} fill="url(#colorPredictions)" name="Total Inferences" />
                <Area type="monotone" dataKey="failures" stroke="#EF4444" fillOpacity={1} fill="url(#colorFailures)" name="Failures Flagged" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Machine Status Breakdown (1 Col) */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 mb-1">
              <PieChartIcon className="w-4 h-4 text-cyan-400" />
              Asset Status Distribution
            </h3>
            <p className="text-xs text-slate-500 mb-4">Plant floor health states</p>
          </div>
          <div className="h-52 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.status_distribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(data?.status_distribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '0.75rem' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-around pt-3 border-t border-slate-800 text-xs">
            {(data?.status_distribution || []).map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                <span className="text-slate-400">{item.name}: <strong className="text-slate-200">{item.value}</strong></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Failure Mode Diagnostics & Recent Predictions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Failure Type Distribution Bar Chart */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-amber-400" />
            Failure Mode Diagnostics
          </h3>
          <p className="text-xs text-slate-500 mb-4">Frequency by specific failure mode</p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.failure_types_breakdown || []} layout="vertical">
                <XAxis type="number" stroke="#64748B" fontSize={10} hide />
                <YAxis dataKey="name" type="category" stroke="#94A3B8" fontSize={10} width={130} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '0.75rem' }}
                />
                <Bar dataKey="value" fill="#F59E0B" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Predictions Table (2 Cols) */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-cyan-400" />
                Recent Model Inferences
              </h3>
              <p className="text-xs text-slate-500">Latest sensor evaluation records</p>
            </div>
            <Link to="/history" className="text-xs font-semibold text-cyan-400 hover:underline flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Machine</th>
                  <th className="pb-3 font-semibold">Failure Prob</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Failure Mode</th>
                  <th className="pb-3 font-semibold text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {(data?.recent_predictions || []).map((pred) => (
                  <tr key={pred.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3">
                      <p className="font-semibold text-slate-200">{pred.machine_name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{pred.machine_sn}</p>
                    </td>
                    <td className="py-3 font-mono font-bold text-slate-200">
                      {(pred.failure_probability * 100).toFixed(1)}%
                    </td>
                    <td className="py-3">
                      {pred.failure_probability > 0.8 ? (
                        <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-semibold uppercase text-[10px]">
                          Critical
                        </span>
                      ) : pred.is_failure ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold uppercase text-[10px]">
                          Warning
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold uppercase text-[10px]">
                          Healthy
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-slate-400 truncate max-w-[150px]">
                      {pred.failure_type}
                    </td>
                    <td className="py-3 text-right text-slate-500 font-mono">
                      {new Date(pred.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {(!data?.recent_predictions || data.recent_predictions.length === 0) && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No prediction logs recorded yet. Run a sensor test to initialize telemetry.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
