import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { machineService } from '../services/machineService';
import { sensorService } from '../services/sensorService';
import { predictionService } from '../services/predictionService';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import { toast } from 'react-hot-toast';
import { FiArrowLeft, FiPlus, FiCpu, FiTrendingUp, FiActivity, FiX } from 'react-icons/fi';
import dayjs from 'dayjs';

const MachineDetails = () => {
  const { id } = useParams();
  const { hasRole } = useAuth();
  const [machine, setMachine] = useState(null);
  const [telemetry, setTelemetry] = useState([]);
  const [totalTelemetry, setTotalTelemetry] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [submittingLog, setSubmittingLog] = useState(false);
  const [predicting, setPredicting] = useState(false);

  const canWrite = hasRole(['Admin', 'Engineer']);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      temperature: '',
      vibration: '',
      pressure: ''
    }
  });

  const loadMachineData = async (telemetryPage = 1) => {
    try {
      const [machineRes, sensorRes] = await Promise.all([
        machineService.getMachine(id),
        sensorService.getSensorHistory({ machineId: Number(id), page: telemetryPage, perPage: 10 })
      ]);

      if (machineRes.success) {
        setMachine(machineRes.data);
      }
      if (sensorRes.success) {
        setTelemetry(sensorRes.data.items || []);
        setTotalTelemetry(sensorRes.data.total || 0);
        setPage(sensorRes.data.page || 1);
      }
    } catch (error) {
      console.error('Error loading machine page details:', error);
      toast.error('Failed to load machine parameters.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMachineData(1);
  }, [id]);

  const onAddTelemetry = async (data) => {
    setSubmittingLog(true);
    try {
      const payload = {
        machine_id: Number(id),
        temperature: Number(data.temperature),
        vibration: Number(data.vibration),
        pressure: Number(data.pressure)
      };

      const response = await sensorService.logSensorData(payload);
      if (response.success) {
        toast.success('Telemetry logged successfully!');
        setLogModalOpen(false);
        reset();
        loadMachineData(page);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit telemetry.');
    } finally {
      setSubmittingLog(false);
    }
  };

  const handlePredict = async () => {
    setPredicting(true);
    try {
      const response = await predictionService.triggerPrediction(Number(id));
      if (response.success) {
        const pred = response.data;
        toast.success(`RUL calculated: ${pred.remaining_useful_life}h remaining!`);
        if (pred.blackbox_triggered) {
          toast.error('CRITICAL FAULT DETECTED: Incident Black Box Generated!', { duration: 6000 });
        }
        loadMachineData(page);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Inference engine failed.');
    } finally {
      setPredicting(false);
    }
  };

  const columns = [
    {
      header: 'Timestamp',
      accessor: 'recorded_at',
      render: (row) => <span>{dayjs(row.recorded_at).format('YYYY-MM-DD HH:mm:ss')}</span>
    },
    {
      header: 'Temperature (°C)',
      accessor: 'temperature',
      render: (row) => <span className="font-mono">{row.temperature}°C</span>
    },
    {
      header: 'Vibration (mm/s)',
      accessor: 'vibration',
      render: (row) => <span className="font-mono">{row.vibration} mm/s</span>
    },
    {
      header: 'Pressure (PSI)',
      accessor: 'pressure',
      render: (row) => <span className="font-mono">{row.pressure} PSI</span>
    },
    {
      header: 'Calculated Health',
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
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
          row.is_anomaly ? 'bg-red-500/10 text-red-500 border-red-500/20 animate-pulse' : 'bg-slate-500/5 text-slate-400 border-slate-200 dark:border-slate-800'
        }`}>
          {row.is_anomaly ? 'CRITICAL' : 'OK'}
        </span>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!machine) {
    return (
      <div className="text-center py-10 space-y-4">
        <p className="text-sm text-slate-500">Machine node not found or deleted.</p>
        <Link to="/machines" className="inline-flex items-center gap-2 text-sm text-brand-500 font-bold">
          <FiArrowLeft className="w-4 h-4" /> Back to List
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Link to="/machines" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">
          <FiArrowLeft className="w-4 h-4" /> Back to directory
        </Link>

        {canWrite && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLogModalOpen(true)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
            >
              <FiPlus className="w-4 h-4" /> Log Telemetry
            </button>
            <button
              onClick={handlePredict}
              disabled={predicting}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-brand-600/10"
            >
              <FiTrendingUp className="w-4 h-4" /> {predicting ? 'Predicting...' : 'Predict RUL'}
            </button>
          </div>
        )}
      </div>

      {/* Grid: Details Metadata & Anomaly Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-150 dark:border-slate-800">
            <FiCpu className="w-6 h-6 text-brand-500" />
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">{machine.machine_name}</h2>
              <span className="text-xs font-mono text-slate-400 font-bold">{machine.machine_code}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-semibold block mb-0.5">Manufacturer</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{machine.manufacturer || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block mb-0.5">Model Number</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{machine.model_number || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block mb-0.5">Serial Number</span>
              <span className="font-bold text-slate-850 dark:text-slate-200">{machine.serial_number}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block mb-0.5">Department</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{machine.department || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block mb-0.5">Installation Location</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{machine.location || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block mb-0.5">Installation Date</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{machine.installation_date || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-455">Operational Node Status</span>
            <div className="flex items-center gap-2 pt-1">
              <span className={`w-2.5 h-2.5 rounded-full ${machine.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500 animate-pulse'}`} />
              <span className="text-xl font-black uppercase text-slate-800 dark:text-slate-100">{machine.status}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-150 dark:border-slate-800 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Last Maintenance:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{machine.last_maintenance_date ? dayjs(machine.last_maintenance_date).format('YYYY-MM-DD') : 'None'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Next Scheduled PM:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{machine.next_maintenance_date ? dayjs(machine.next_maintenance_date).format('YYYY-MM-DD') : 'None'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Telemetry Logs */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Historical Telemetry Logs</h3>
        <div className="h-100">
          <DataTable
            columns={columns}
            data={telemetry}
            loading={loading}
            page={page}
            perPage={10}
            total={totalTelemetry}
            onPageChange={loadMachineData}
            emptyMessage="No telemetry logged for this machine."
          />
        </div>
      </div>

      {/* Log Telemetry Modal */}
      {logModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setLogModalOpen(false)} />
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl p-6 shadow-2xl relative z-10">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-850 mb-4">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <FiActivity className="text-brand-500" /> Log Sensor Telemetry
              </h3>
              <button onClick={() => setLogModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onAddTelemetry)} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Temperature (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 72.5"
                  {...register('temperature', { required: 'Temperature is required' })}
                  className="w-full px-3 py-2 border border-slate-250 dark:border-slate-800 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Vibration (mm/s)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 2.4"
                  {...register('vibration', { required: 'Vibration is required' })}
                  className="w-full px-3 py-2 border border-slate-250 dark:border-slate-800 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pressure (PSI)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 52.0"
                  {...register('pressure', { required: 'Pressure is required' })}
                  className="w-full px-3 py-2 border border-slate-250 dark:border-slate-800 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setLogModalOpen(false)}
                  className="px-4 py-2 border border-slate-250 dark:border-slate-800 text-slate-655 dark:text-slate-400 rounded-lg text-sm font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingLog}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-sm font-bold transition-all cursor-pointer"
                >
                  {submittingLog ? 'Logging...' : 'Submit Feed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MachineDetails;
