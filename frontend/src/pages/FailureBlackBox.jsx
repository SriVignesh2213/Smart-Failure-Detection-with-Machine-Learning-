import React, { useState, useEffect } from 'react';
import { blackboxService } from '../services/blackboxService';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import { toast } from 'react-hot-toast';
import { FiShield, FiCpu, FiEye, FiClock, FiActivity, FiX, FiCheckCircle } from 'react-icons/fi';
import dayjs from 'dayjs';

const FailureBlackBox = () => {
  const { hasRole } = useAuth();
  const [snapshots, setSnapshots] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  // Replay Details Drawer State
  const [replayOpen, setReplayOpen] = useState(false);
  const [activeReplay, setActiveReplay] = useState(null);
  const [replayLoading, setReplayLoading] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [submittingResolution, setSubmittingResolution] = useState(false);

  const canWrite = hasRole(['Admin', 'Engineer']);

  const fetchSnapshots = async (currentPage) => {
    setLoading(true);
    try {
      const response = await blackboxService.getBlackboxSnapshots({ page: currentPage, perPage: 10 });
      if (response.success) {
        setSnapshots(response.data.snapshots || []);
        setTotal(response.data.total || 0);
        setPage(response.data.page || 1);
      }
    } catch (error) {
      console.error('Error fetching snapshots:', error);
      toast.error('Failed to load blackbox incident history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSnapshots(1);
  }, []);

  const handleOpenReplay = async (id) => {
    setReplayLoading(true);
    setResolutionNotes('');
    setReplayOpen(true);
    try {
      const response = await blackboxService.replayFailureEvent(id);
      if (response.success) {
        setActiveReplay(response.data);
      }
    } catch (error) {
      toast.error('Failed to compile event replay.');
      setReplayOpen(false);
    } finally {
      setReplayLoading(false);
    }
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    if (!resolutionNotes.trim()) {
      toast.error('Resolution notes are required.');
      return;
    }

    setSubmittingResolution(true);
    try {
      const response = await blackboxService.resolveBlackbox(activeReplay.snapshot_id, resolutionNotes);
      if (response.success) {
        toast.success('Incident resolved successfully!');
        setReplayOpen(false);
        fetchSnapshots(page);
      }
    } catch (error) {
      toast.error('Failed to update resolution.');
    } finally {
      setSubmittingResolution(false);
    }
  };

  const columns = [
    {
      header: 'Incident ID',
      accessor: 'id',
      render: (row) => <span className="font-bold">#SNAP-{row.id}</span>
    },
    {
      header: 'Machine ID',
      accessor: 'machine_id',
      render: (row) => <span className="font-semibold">Machine #{row.machine_id}</span>
    },
    {
      header: 'Trigger Event',
      accessor: 'trigger_event',
      render: (row) => <span className="text-xs text-slate-500 max-w-50 truncate block">{row.trigger_event}</span>
    },
    {
      header: 'Incident Time',
      accessor: 'failure_time',
      render: (row) => <span>{dayjs(row.failure_time).format('YYYY-MM-DD HH:mm:ss')}</span>
    },
    {
      header: 'Severity',
      accessor: 'failure_severity',
      render: (row) => (
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${
          row.failure_severity === 'Critical' ? 'bg-red-500/10 text-red-500 border-red-500/20 animate-pulse' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
        }`}>
          {row.failure_severity}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
          row.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20 animate-pulse'
        }`}>
          {row.status}
        </span>
      )
    },
    {
      header: 'Details',
      accessor: 'id',
      render: (row) => (
        <button
          onClick={() => handleOpenReplay(row.id)}
          className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-all border border-slate-700/50"
        >
          <FiEye /> Replay
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h2 className="text-lg font-bold text-slate-850 dark:text-slate-100 flex items-center gap-2">
          <FiShield className="text-brand-500 animate-pulse" /> Failure Incident Black Boxes
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Audit failsafe snapshot buffers capturing critical anomalies, RUL estimations, and telemetry leading up to failure</p>
      </div>

      <div className="h-[calc(100vh-210px)]">
        <DataTable
          columns={columns}
          data={snapshots}
          loading={loading}
          page={page}
          perPage={10}
          total={total}
          onPageChange={fetchSnapshots}
          emptyMessage="No failure incidents recorded. System optimal."
        />
      </div>

      {/* Slide-out Drawer / Replay Overlay */}
      {replayOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setReplayOpen(false)} />
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-850 h-screen shadow-2xl relative flex flex-col p-6 z-10 animate-slide-in overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-850 mb-6">
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <FiShield className="text-brand-500" /> Failure Incident Replay console
              </h3>
              <button onClick={() => setReplayOpen(false)} className="p-1 text-slate-400 hover:text-slate-655 rounded">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {replayLoading || !activeReplay ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2">
                <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-slate-400">Loading flight parameters...</span>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-6 pr-1 pb-6">
                {/* Event Summary */}
                <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-red-500">Incident Severity: {activeReplay.severity}</span>
                    <span className="text-[10px] text-slate-400">{dayjs(activeReplay.failure_time).format('YYYY-MM-DD HH:mm:ss')}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{activeReplay.trigger_event}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    <strong>AI Root Cause Analysis:</strong> {activeReplay.prediction_analysis?.root_cause || 'Telemetry spike leading to bearing overload.'}
                  </p>
                </div>

                {/* AI Snapshot Metadata */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-950/20">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block mb-0.5">Failure Prob.</span>
                    <span className="text-lg font-black text-slate-850 dark:text-slate-100">
                      {activeReplay.prediction_analysis?.prediction?.failure_probability || '1.0'}
                    </span>
                  </div>
                  <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-950/20">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block mb-0.5">Est. RUL</span>
                    <span className="text-lg font-black text-red-500">
                      {activeReplay.prediction_analysis?.prediction?.remaining_useful_life || '0.0'}h
                    </span>
                  </div>
                  <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-950/20">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block mb-0.5">Health Index</span>
                    <span className="text-lg font-black text-amber-500">
                      {activeReplay.prediction_analysis?.prediction?.health_score || '41.2'}%
                    </span>
                  </div>
                </div>

                {/* Timeline of events */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <FiClock className="text-brand-500" /> Anomaly Timeline (Chronological)
                  </h4>
                  <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-3 space-y-6 py-2">
                    {(activeReplay.timeline_events || []).map((evt, idx) => (
                      <div key={idx} className="relative pl-6">
                        {/* Bullet circle */}
                        <span className={`absolute -left-1.5 top-1.5 w-2.5 h-2.5 rounded-full border border-white dark:border-slate-900 ${
                          evt.event_type === 'CRITICAL_FAILURE' ? 'bg-red-500 animate-pulse' :
                          evt.event_type === 'ANOMALY_DETECTED' ? 'bg-amber-500' : 'bg-slate-400'
                        }`} />
                        <span className="text-[9px] font-mono text-slate-400 block">{dayjs(evt.timestamp).format('HH:mm:ss')}</span>
                        <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">{evt.event_type}</h5>
                        <p className="text-xs text-slate-555 leading-relaxed mt-0.5">{evt.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pre-failure Sensor snapshot */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <FiActivity className="text-brand-500" /> Sensor Stream Snapshot (24-Hour)
                  </h4>
                  <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="px-4 py-2">Timestamp</th>
                          <th className="px-4 py-2">Temp (°C)</th>
                          <th className="px-4 py-2">Vib (mm/s)</th>
                          <th className="px-4 py-2">Press (PSI)</th>
                          <th className="px-4 py-2">Health</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150 dark:divide-slate-800 text-slate-655 dark:text-slate-350 font-mono">
                        {(activeReplay.telemetry_24h_series || []).slice(0, 5).map((snap, sidx) => (
                          <tr key={sidx}>
                            <td className="px-4 py-2">{dayjs(snap.recorded_at).format('HH:mm:ss')}</td>
                            <td className="px-4 py-2">{snap.temperature}°C</td>
                            <td className="px-4 py-2">{snap.vibration}mm/s</td>
                            <td className="px-4 py-2">{snap.pressure}PSI</td>
                            <td className="px-4 py-2">{snap.health_score}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Action Resolution Form */}
                {canWrite && !activeReplay.resolved && (
                  <form onSubmit={handleResolve} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <FiCheckCircle className="text-brand-500" /> Mark Incident Resolved
                    </h4>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Resolution Notes</label>
                      <textarea
                        rows="3"
                        placeholder="Detail mechanical adjustments or replacement actions (e.g. replaced worn rotor bearing)..."
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-250 dark:border-slate-800 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submittingResolution}
                      className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                    >
                      {submittingResolution ? 'Submitting Resolution...' : 'Resolve Anomaly'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FailureBlackBox;
