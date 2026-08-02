import React, { useState, useEffect } from 'react';
import { predictionService } from '../services/predictionService';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import { toast } from 'react-hot-toast';
import { FiTrendingUp, FiFilter, FiCheckCircle, FiX } from 'react-icons/fi';
import dayjs from 'dayjs';

const Predictions = () => {
  const { hasRole } = useAuth();
  const [predictions, setPredictions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  // Filters
  const [machineId, setMachineId] = useState('');
  const [status, setStatus] = useState('');

  const canWrite = hasRole(['Admin', 'Engineer']);

  const fetchPredictions = async (currentPage) => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        perPage: 10
      };

      if (machineId) params.machineId = Number(machineId);
      if (status) params.status = status;

      const response = await predictionService.getPredictions(params);
      if (response.success) {
        setPredictions(response.data.predictions || []);
        setTotal(response.data.total || 0);
        setPage(response.data.page || 1);
      }
    } catch (error) {
      console.error('Error fetching predictions:', error);
      toast.error('Failed to load predictive analytics alerts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions(1);
  }, []);

  const handleResolveAlert = async (id) => {
    try {
      // mark status as "Addressed"
      const response = await predictionService.updatePredictionStatus(id, 'Addressed');
      if (response.success) {
        toast.success('Prediction alert resolved successfully!');
        fetchPredictions(page);
      }
    } catch (error) {
      toast.error('Failed to resolve prediction alert.');
    }
  };

  const handleApplyFilters = (e) => {
    e.preventDefault();
    fetchPredictions(1);
  };

  const handleClearFilters = () => {
    setMachineId('');
    setStatus('');
    setTimeout(() => fetchPredictions(1), 50);
  };

  const columns = [
    {
      header: 'Predicted At',
      accessor: 'predicted_at',
      render: (row) => <span>{dayjs(row.predicted_at).format('YYYY-MM-DD HH:mm:ss')}</span>
    },
    {
      header: 'Machine ID',
      accessor: 'machine_id',
      render: (row) => <span className="font-bold">#{row.machine_id}</span>
    },
    {
      header: 'RUL (Hours)',
      accessor: 'remaining_useful_life',
      render: (row) => <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{row.remaining_useful_life} Hrs</span>
    },
    {
      header: 'Failure Prob.',
      accessor: 'failure_probability',
      render: (row) => <span className="font-mono text-xs font-semibold">{row.failure_probability}</span>
    },
    {
      header: 'Predicted Mode',
      accessor: 'predicted_failure_type',
      render: (row) => <span className="text-xs text-slate-500 max-w-50 truncate block" title={row.predicted_failure_type}>{row.predicted_failure_type}</span>
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => {
        const statusMap = {
          Critical: 'bg-red-500/10 text-red-500 border-red-500/20 animate-pulse',
          Warning: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
          Normal: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
          Addressed: 'bg-slate-500/10 text-slate-455 border-slate-500/25'
        };
        return (
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${statusMap[row.status] || statusMap.Normal}`}>
            {row.status}
          </span>
        );
      }
    },
    {
      header: 'Resolution',
      accessor: 'id',
      render: (row) => (
        canWrite && row.status !== 'Addressed' && row.status !== 'Normal' ? (
          <button
            onClick={() => handleResolveAlert(row.id)}
            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all"
            title="Mark Resolved"
          >
            <FiCheckCircle /> Address
          </button>
        ) : (
          <span className="text-[10px] text-slate-400 font-medium">None</span>
        )
      )
    }
  ];

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h2 className="text-lg font-bold text-slate-850 dark:text-slate-100">Predictive Analytics alerts</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Audit machine health indexing, failure warnings, and estimated Remaining Useful Life (RUL)</p>
      </div>

      {/* Filters form */}
      <form onSubmit={handleApplyFilters} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-555">
          <FiFilter className="text-brand-500" /> Filter Criteria
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Machine ID</label>
            <input
              type="number"
              placeholder="e.g. 1"
              value={machineId}
              onChange={(e) => setMachineId(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Risk Severity</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="Normal">Normal</option>
              <option value="Warning">Warning</option>
              <option value="Critical">Critical</option>
              <option value="Addressed">Addressed</option>
            </select>
          </div>

          <div></div>

          <div className="flex gap-2">
            <button type="submit" className="flex-1 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-bold cursor-pointer">
              Apply Filter
            </button>
            <button type="button" onClick={handleClearFilters} className="flex-1 py-2 border border-slate-200 dark:border-slate-800 text-slate-655 dark:text-slate-400 rounded-lg text-xs font-bold hover:bg-slate-50 cursor-pointer">
              Reset
            </button>
          </div>
        </div>
      </form>

      <div className="h-[calc(100vh-320px)]">
        <DataTable
          columns={columns}
          data={predictions}
          loading={loading}
          page={page}
          perPage={10}
          total={total}
          onPageChange={fetchPredictions}
          emptyMessage="No predictions found matching these filters."
        />
      </div>
    </div>
  );
};

export default Predictions;
