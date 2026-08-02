import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { machineService } from '../services/machineService';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import { toast } from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiCpu, FiX } from 'react-icons/fi';

const MachineManagement = () => {
  const { hasRole } = useAuth();
  const [machines, setMachines] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState(null);

  const canWrite = hasRole(['Admin', 'Engineer']);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm({
    defaultValues: {
      machine_name: '',
      machine_code: '',
      machine_type: '',
      serial_number: '',
      manufacturer: '',
      model_number: '',
      department: '',
      location: '',
      installation_date: '',
      status: 'Active'
    }
  });

  const fetchMachines = async (currentPage) => {
    setLoading(true);
    try {
      const response = await machineService.getMachines(currentPage, 10);
      if (response.success) {
        setMachines(response.data.machines || []);
        setTotal(response.data.total || 0);
        setPage(response.data.page || 1);
      }
    } catch (error) {
      console.error('Error fetching machines:', error);
      toast.error('Failed to load machine directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMachines(1);
  }, []);

  const handleOpenCreate = () => {
    setEditingMachine(null);
    reset({
      machine_name: '',
      machine_code: '',
      machine_type: '',
      serial_number: '',
      manufacturer: '',
      model_number: '',
      department: '',
      location: '',
      installation_date: '',
      status: 'Active'
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (machine) => {
    setEditingMachine(machine);
    // Populate form fields
    reset({
      machine_name: machine.machine_name,
      machine_code: machine.machine_code,
      machine_type: machine.machine_type,
      serial_number: machine.serial_number,
      manufacturer: machine.manufacturer || '',
      model_number: machine.model_number || '',
      department: machine.department || '',
      location: machine.location || '',
      installation_date: machine.installation_date ? machine.installation_date.split('T')[0] : '',
      status: machine.status || 'Active'
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to soft-delete this machine node?')) {
      try {
        const response = await machineService.deleteMachine(id);
        if (response.success) {
          toast.success('Machine soft-deleted successfully!');
          fetchMachines(page);
        }
      } catch (error) {
        toast.error('Failed to delete machine.');
      }
    }
  };

  const onSubmit = async (data) => {
    try {
      let response;
      if (editingMachine) {
        response = await machineService.updateMachine(editingMachine.id, data);
        if (response.success) {
          toast.success('Machine details updated successfully!');
        }
      } else {
        response = await machineService.createMachine(data);
        if (response.success) {
          toast.success('Machine registered successfully!');
        }
      }
      setModalOpen(false);
      fetchMachines(page);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed.');
    }
  };

  const columns = [
    {
      header: 'Machine Code',
      accessor: 'machine_code',
      render: (row) => <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-100">{row.machine_code}</span>
    },
    {
      header: 'Machine Name',
      accessor: 'machine_name',
      render: (row) => <span className="font-semibold text-slate-800 dark:text-slate-200">{row.machine_name}</span>
    },
    {
      header: 'Type',
      accessor: 'machine_type'
    },
    {
      header: 'Location / Dept',
      accessor: 'location',
      render: (row) => (
        <span className="text-xs text-slate-500">
          {row.location || 'N/A'} • {row.department || 'N/A'}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => {
        const statusMap = {
          Active: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
          Inactive: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
          Maintenance: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
          Failed: 'bg-red-500/10 text-red-500 border-red-500/20 animate-pulse'
        };
        return (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${statusMap[row.status] || statusMap.Active}`}>
            {row.status}
          </span>
        );
      }
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Link
            to={`/machines/${row.id}`}
            className="p-1.5 text-slate-400 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
            title="View Details"
          >
            <FiEye className="w-4 h-4" />
          </Link>
          {canWrite && (
            <>
              <button
                onClick={() => handleOpenEdit(row)}
                className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                title="Edit Details"
              >
                <FiEdit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(row.id)}
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                title="Soft Delete"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Machine Directory</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Manage and track monitored physical industrial nodes</p>
        </div>
        {canWrite && (
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            <FiPlus className="w-4 h-4" /> Register Node
          </button>
        )}
      </div>

      <div className="h-[calc(100vh-210px)]">
        <DataTable
          columns={columns}
          data={machines}
          loading={loading}
          page={page}
          perPage={10}
          total={total}
          onPageChange={fetchMachines}
          emptyMessage="No machines registered."
        />
      </div>

      {/* Slide-out Drawer / Modal for CRUD */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-850 h-screen shadow-2xl relative flex flex-col p-6 z-10 animate-slide-in">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-850 mb-6">
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <FiCpu className="text-brand-500" /> {editingMachine ? 'Edit Machine Node' : 'Register Machine Node'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Machine Name</label>
                  <input
                    type="text"
                    {...register('machine_name', { required: 'Name is required' })}
                    className="w-full px-3 py-2 border border-slate-250 dark:border-slate-800 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                  {errors.machine_name && <span className="text-xs text-red-500 font-semibold">{errors.machine_name.message}</span>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Machine Code</label>
                  <input
                    type="text"
                    {...register('machine_code', { required: 'Code is required' })}
                    className="w-full px-3 py-2 border border-slate-250 dark:border-slate-800 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                  {errors.machine_code && <span className="text-xs text-red-500 font-semibold">{errors.machine_code.message}</span>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Machine Type</label>
                  <input
                    type="text"
                    placeholder="e.g. Milling Machine"
                    {...register('machine_type', { required: 'Type is required' })}
                    className="w-full px-3 py-2 border border-slate-250 dark:border-slate-800 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Serial Number</label>
                  <input
                    type="text"
                    {...register('serial_number', { required: 'Serial number is required' })}
                    className="w-full px-3 py-2 border border-slate-250 dark:border-slate-800 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Manufacturer</label>
                  <input
                    type="text"
                    {...register('manufacturer')}
                    className="w-full px-3 py-2 border border-slate-250 dark:border-slate-800 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Model Number</label>
                  <input
                    type="text"
                    {...register('model_number')}
                    className="w-full px-3 py-2 border border-slate-250 dark:border-slate-800 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Department</label>
                  <input
                    type="text"
                    {...register('department')}
                    className="w-full px-3 py-2 border border-slate-250 dark:border-slate-800 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Location</label>
                  <input
                    type="text"
                    {...register('location')}
                    className="w-full px-3 py-2 border border-slate-250 dark:border-slate-800 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Installation Date</label>
                  <input
                    type="date"
                    {...register('installation_date')}
                    className="w-full px-3 py-2 border border-slate-250 dark:border-slate-800 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</label>
                  <select
                    {...register('status')}
                    className="w-full px-3 py-2 border border-slate-250 dark:border-slate-800 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Failed">Failed</option>
                  </select>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200 dark:border-slate-850 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-655 dark:text-slate-400 rounded-lg text-sm font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-sm font-bold transition-all cursor-pointer"
                >
                  {editingMachine ? 'Update Node' : 'Register Node'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MachineManagement;
