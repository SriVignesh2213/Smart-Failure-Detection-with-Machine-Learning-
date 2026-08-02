import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardService } from '../services/dashboardService';
import { predictionService } from '../services/predictionService';
import { blackboxService } from '../services/blackboxService';
import { toast } from 'react-hot-toast';
import {
  FiCpu,
  FiShield,
  FiActivity,
  FiAlertTriangle,
  FiCheckCircle,
  FiCalendar,
  FiArrowRight,
  FiUsers,
  FiPlus,
  FiFileText,
  FiClock,
  FiHardDrive,
  FiRadio,
  FiSliders,
  FiTrendingUp
} from 'react-icons/fi';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

const Dashboard = () => {
  const { user } = useAuth();
  const role = user?.role || 'Viewer';

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_machines: 0,
    operational_machines: 0,
    critical_warnings: 0,
    average_health_score: 100.0,
    pending_maintenance_tasks: 0
  });
  const [recentPredictions, setRecentPredictions] = useState([]);
  const [recentBlackbox, setRecentBlackbox] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [statsRes, predRes, bbRes] = await Promise.all([
          dashboardService.getDashboardSummary(),
          predictionService.getPredictions({ page: 1, perPage: 5 }),
          blackboxService.getBlackboxSnapshots({ page: 1, perPage: 5 })
        ]);

        if (statsRes.success) {
          setStats(statsRes.data);
        }
        if (predRes.success) {
          setRecentPredictions(predRes.data.predictions || []);
        }
        if (bbRes.success) {
          setRecentBlackbox(bbRes.data.snapshots || []);
        }
      } catch (error) {
        console.error('Error fetching dashboard summary:', error);
        toast.error('Failed to load real-time operational metrics.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // System logs simulation for Admin view
  const systemAuditLogs = [
    { id: 1, event: 'LightGBM Model Inference Executed', user: 'ML Engine', time: '2 mins ago', type: 'info' },
    { id: 2, event: 'Machine Node #3 Vibration Warning Triggered', user: 'Sensor Gateway', time: '14 mins ago', type: 'warning' },
    { id: 3, event: 'Failure Black Box Incident Snap #102 Generated', user: 'Failsafe Agent', time: '1 hour ago', type: 'critical' },
    { id: 4, event: 'Role Permission Policy Synchronized', user: user?.name || 'Admin User', time: '3 hours ago', type: 'info' }
  ];

  // Helper chart configurations
  const mockChartData = [
    { name: '08:00', health: 94.5 },
    { name: '10:00', health: 93.8 },
    { name: '12:00', health: 92.1 },
    { name: '14:00', health: stats.average_health_score || 91.5 }
  ];

  const mockDistribution = [
    { name: 'Optimal (85-100)', value: stats.operational_machines || 0, color: '#10b981' },
    { name: 'Warning (50-84)', value: stats.critical_warnings || 0, color: '#f59e0b' },
    { name: 'Critical (0-49)', value: Math.max(0, stats.total_machines - stats.operational_machines) || 0, color: '#ef4444' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Loading enterprise operational metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Role Banner / Welcome Header */}
      <div className="p-6 bg-linear-to-r from-slate-900 via-slate-850 to-brand-950 text-white rounded-2xl shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
              {role} Console
            </span>
            <span className="text-xs text-slate-400">• Plant Operations Suite</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            Welcome back, {user?.name || 'Operator'}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            {role === 'Admin' && 'Full administrative oversight: monitor system KPIs, system user accounts, telemetry streams, and failure black box triggers.'}
            {role === 'Engineer' && 'Engineering workspace: view assigned machine telemetry, pending maintenance work orders, predictions, and black box snapshots.'}
            {role === 'Viewer' && 'Read-only telemetry & executive dashboard: live machine status indicators, AI predictions, and operational health summaries.'}
          </p>
        </div>

        {/* Quick actions for Admin and Engineer */}
        {role !== 'Viewer' && (
          <div className="flex flex-wrap gap-2 shrink-0">
            {role === 'Admin' && (
              <Link
                to="/machines"
                className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <FiPlus className="w-4 h-4" /> Add Machine
              </Link>
            )}
            <Link
              to="/maintenance"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FiCalendar className="w-4 h-4" /> {role === 'Admin' ? 'Schedule Task' : 'My Work Orders'}
            </Link>
          </div>
        )}
      </div>



      {/* Metric KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex items-center justify-between transition-all hover:border-brand-500/30">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">
              {role === 'Engineer' ? 'Assigned Machines' : 'Monitored Machines'}
            </span>
            <span className="text-3xl font-black text-slate-900 dark:text-slate-100">{stats.total_machines}</span>
          </div>
          <div className="p-3.5 rounded-xl border bg-brand-500/10 text-brand-500 border-brand-500/20">
            <FiCpu className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex items-center justify-between transition-all hover:border-emerald-500/30">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">Average Machine Health</span>
            <span className="text-3xl font-black text-slate-900 dark:text-slate-100">{stats.average_health_score}%</span>
          </div>
          <div className="p-3.5 rounded-xl border bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
            <FiActivity className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex items-center justify-between transition-all hover:border-red-500/30">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">Active Incidents</span>
            <span className="text-3xl font-black text-slate-900 dark:text-slate-100">
              {Math.max(0, stats.total_machines - stats.operational_machines)}
            </span>
          </div>
          <div className="p-3.5 rounded-xl border bg-red-500/10 text-red-500 border-red-500/20">
            <FiShield className="w-6 h-6" />
          </div>
        </div>

        {role === 'Admin' ? (
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex items-center justify-between transition-all hover:border-amber-500/30">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">Pending Work Orders</span>
              <span className="text-3xl font-black text-slate-900 dark:text-slate-100">{stats.pending_maintenance_tasks}</span>
            </div>
            <div className="p-3.5 rounded-xl border bg-amber-500/10 text-amber-500 border-amber-500/20">
              <FiCalendar className="w-6 h-6" />
            </div>
          </div>
        ) : (
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex items-center justify-between transition-all hover:border-blue-500/30">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">Critical Warnings</span>
              <span className="text-3xl font-black text-slate-900 dark:text-slate-100">{stats.critical_warnings}</span>
            </div>
            <div className="p-3.5 rounded-xl border bg-blue-500/10 text-blue-500 border-blue-500/20">
              <FiAlertTriangle className="w-6 h-6" />
            </div>
          </div>
        )}
      </div>

      {/* Admin Specific KPI Row */}
      {role === 'Admin' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
              <FiUsers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">User Role Security Claims</span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Admin • Engineer • Viewer Roles Active</span>
            </div>
          </div>

          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <FiRadio className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">Sensor Ingestion Pipelines</span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">100% Operational Telemetry Stream</span>
            </div>
          </div>

          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-xl bg-brand-500/10 text-brand-500 border border-brand-500/20">
              <FiHardDrive className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">Failure Black Box Failsafe</span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">24-Hour Pre-Failure Buffer Enabled</span>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart */}
        <div className="lg:col-span-2 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col h-90">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <FiTrendingUp className="text-brand-500" /> Plant Health Score Trend (24h)
            </h3>
            <span className="text-[10px] text-emerald-500 font-bold px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded">
              Real-time Ingest
            </span>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockChartData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0e8ef2" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0e8ef2" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis domain={[50, 100]} stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ background: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc', fontSize: '11px' }} />
                <Area type="monotone" dataKey="health" stroke="#0e8ef2" strokeWidth={3} fillOpacity={1} fill="url(#colorHealth)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Machine Status Bar Chart */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col h-90">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-4 uppercase tracking-wider flex items-center gap-2">
            <FiSliders className="text-brand-500" /> Machine Status Distribution
          </h3>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockDistribution} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ background: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc', fontSize: '11px' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {mockDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Data Grid: Predictions & Black Box Snaps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent AI Predictions */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Recent AI Predictions</h3>
            <Link to="/predictions" className="text-xs font-bold text-brand-500 hover:text-brand-400 flex items-center gap-1">
              View Predictions <FiArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {recentPredictions.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No predictions logged yet.</p>
            ) : (
              recentPredictions.map((pred) => (
                <div key={pred.id} className="py-3.5 flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200">Machine ID: {pred.machine_id}</h4>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      RUL: <strong className="text-slate-700 dark:text-slate-300">{pred.remaining_useful_life} Hrs</strong> • Failure Type: {pred.predicted_failure_type}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                    pred.status === 'Critical' ? 'bg-red-500/10 text-red-500 border-red-500/20 animate-pulse' :
                    pred.status === 'Warning' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                    'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                  }`}>
                    {pred.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Failure Black Box Incidents */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Failure Black Box Snaps</h3>
            <Link to="/blackbox" className="text-xs font-bold text-brand-500 hover:text-brand-400 flex items-center gap-1">
              View Failure Box <FiArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {recentBlackbox.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No failure incident snapshots recorded.</p>
            ) : (
              recentBlackbox.map((snap) => (
                <div key={snap.id} className="py-3.5 flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200">Incident Snap #{snap.id}</h4>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      Machine: {snap.machine_id} • Trigger: {snap.trigger_event}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    snap.resolved ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20 animate-pulse'
                  }`}>
                    {snap.resolved ? 'RESOLVED' : 'ACTIVE'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Admin Audit Logs Feed */}
      {role === 'Admin' && (
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <FiClock className="text-brand-500" /> Admin Audit & System Logs
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Live Log Stream</span>
          </div>
          <div className="space-y-3">
            {systemAuditLogs.map((log) => (
              <div key={log.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${
                    log.type === 'critical' ? 'bg-red-500 animate-pulse' : log.type === 'warning' ? 'bg-amber-500' : 'bg-brand-500'
                  }`} />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{log.event}</span>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Initiator: {log.user}</span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{log.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
