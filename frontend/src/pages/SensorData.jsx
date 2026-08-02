import React, { useState, useEffect } from 'react';
import { sensorService } from '../services/sensorService';
import DataTable from '../components/DataTable';
import { toast } from 'react-hot-toast';
import { FiDatabase, FiFilter } from 'react-icons/fi';
import dayjs from 'dayjs';

const SensorData = () => {
  const [telemetry, setTelemetry] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  // Filters state
  const [machineId, setMachineId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchTelemetryHistory = async (currentPage) => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        perPage: 15
      };

      if (machineId) params.machineId = Number(machineId);
      if (startDate) params.startDate = new Date(startDate).toISOString();
      if (endDate) params.endDate = new Date(endDate).toISOString();

      const response = await sensorService.getSensorHistory(params);
      if (response.success) {
        setTelemetry(response.data.items || []);
        setTotal(response.data.total || 0);
        setPage(response.data.page || 1);
      }
    } catch (error) {
      console.error('Error fetching global telemetry:', error);
      toast.error('Failed to load telemetry history logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetryHistory(1);
  }, []);

  const handleApplyFilters = (e) => {
    e.preventDefault();
    fetchTelemetryHistory(1);
  };

  const handleClearFilters = () => {
    setMachineId('');
    setStartDate('');
    setEndDate('');
    // Trigger reset list
    setTimeout(() => fetchTelemetryHistory(1), 50);
  };

  const columns = [
    {
      header: 'Timestamp',
      accessor: 'recorded_at',
      render: (row) => <span>{dayjs(row.recorded_at).format('YYYY-MM-DD HH:mm:ss')}</span>
    },
    {
      header: 'Machine ID',
      accessor: 'machine_id',
      render: (row) => <span className="font-bold text-slate-800 dark:text-slate-200">#{row.machine_id}</span>
    },
    {
      header: 'Temperature',
      accessor: 'temperature',
      render: (row) => <span className="font-mono text-xs">{row.temperature}°C</span>
    },
    {
      header: 'Vibration',
      accessor: 'vibration',
      render: (row) => <span className="font-mono text-xs">{row.vibration} mm/s</span>
    },
    {
      header: 'Pressure',
      accessor: 'pressure',
      render: (row) => <span className="font-mono text-xs">{row.pressure} PSI</span>
    },
    {
      header: 'Telemetry Health',
      accessor: 'health_score',
      render: (row) => {
        const isHealthy = row.health_score >= 80;
        return (
          <span className={`font-bold ${isHealthy ? 'text-emerald-500' : 'text-amber-500'}`}>
            {row.health_score}%
          </span>
        );
      }
    },
    {
      header: 'Anomaly',
      accessor: 'is_anomaly',
      render: (row) => (
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${
          row.is_anomaly ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-slate-500/5 text-slate-400 border-slate-200 dark:border-slate-800'
        }`}>
          {row.is_anomaly ? 'ANOMALOUS' : 'NORMAL'}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h2 className="text-lg font-bold text-slate-850 dark:text-slate-100">Global Telemetry Logs</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Audit historical sensor stream telemetry ingested across all machine nodes</p>
      </div>

      {/* Filter Options */}
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
              className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-bold cursor-pointer"
            >
              Apply Filter
            </button>
            <button
              type="button"
              onClick={handleClearFilters}
              className="flex-1 py-2 border border-slate-200 dark:border-slate-800 text-slate-655 dark:text-slate-400 rounded-lg text-xs font-bold hover:bg-slate-50 cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>
      </form>

      <div className="h-[calc(100vh-320px)]">
        <DataTable
          columns={columns}
          data={telemetry}
          loading={loading}
          page={page}
          perPage={15}
          total={total}
          onPageChange={fetchTelemetryHistory}
          emptyMessage="No telemetry logged matching these filters."
        />
      </div>
    </div>
  );
};

export default SensorData;
