import React, { useState } from 'react';
import { Settings as SettingsIcon, Sliders, Database, Save, CheckCircle2 } from 'lucide-react';

const Settings: React.FC = () => {
  const [warningThreshold, setWarningThreshold] = useState(0.40);
  const [criticalThreshold, setCriticalThreshold] = useState(0.75);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-cyan-400" />
          Predictive Model & System Threshold Settings
        </h1>
        <p className="text-xs text-slate-400 mt-1">Configure failure probability alert cutoffs and machine telemetry boundaries</p>
      </div>

      <form onSubmit={handleSave} className="glass-panel p-8 rounded-2xl space-y-6">
        <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
          <Sliders className="w-4 h-4 text-cyan-400" />
          Model Risk Cutoff Sensitivity
        </h2>

        {saved && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Threshold parameters updated successfully.</span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1 text-xs">
              <label className="font-semibold text-slate-300">Warning Risk Threshold ({(warningThreshold * 100).toFixed(0)}%)</label>
              <span className="text-slate-500 text-[10px]">Probability range: 25% - 50%</span>
            </div>
            <input
              type="range"
              min="0.25"
              max="0.50"
              step="0.01"
              value={warningThreshold}
              onChange={(e) => setWarningThreshold(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <p className="text-[10px] text-slate-500 mt-1">Predictions above this percentage flag the machine as WARNING.</p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1 text-xs">
              <label className="font-semibold text-slate-300">Critical Risk Threshold ({(criticalThreshold * 100).toFixed(0)}%)</label>
              <span className="text-slate-500 text-[10px]">Probability range: 60% - 90%</span>
            </div>
            <input
              type="range"
              min="0.60"
              max="0.90"
              step="0.01"
              value={criticalThreshold}
              onChange={(e) => setCriticalThreshold(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
            <p className="text-[10px] text-slate-500 mt-1">Predictions above this percentage trigger CRITICAL status and immediate shutdown alerts.</p>
          </div>
        </div>

        <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pt-4 pb-3">
          <Database className="w-4 h-4 text-cyan-400" />
          Datastore & Dataset Status
        </h2>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
            <span className="text-slate-500 uppercase tracking-wider text-[10px] block">Training Source Dataset</span>
            <strong className="text-slate-200 mt-1 block font-mono">predictive_maintenance.csv</strong>
          </div>

          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
            <span className="text-slate-500 uppercase tracking-wider text-[10px] block">Datastore Driver</span>
            <strong className="text-emerald-400 mt-1 block font-mono">MongoDB (Async Motor)</strong>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-lg shadow-cyan-500/10 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
