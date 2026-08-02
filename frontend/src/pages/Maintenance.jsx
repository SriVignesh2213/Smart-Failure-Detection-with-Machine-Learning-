import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { maintenanceService } from "../services/maintenanceService";
import { machineService } from "../services/machineService";
import { useAuth } from "../context/AuthContext";
import DataTable from "../components/DataTable";
import { toast } from "react-hot-toast";
import {
  FiCalendar,
  FiPlus,
  FiEdit2,
  FiCpu,
  FiUser,
  FiX,
  FiCheckCircle,
} from "react-icons/fi";
import dayjs from "dayjs";

const Maintenance = () => {
  const { hasRole, user: currentUser } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [machines, setMachines] = useState([]);

  // Modals state
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [activeLog, setActiveLog] = useState(null);
  const [submittingSchedule, setSubmittingSchedule] = useState(false);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const canWrite = hasRole(["Admin", "Engineer"]);

  const {
    register: registerSchedule,
    handleSubmit: handleScheduleSubmit,
    reset: resetSchedule,
    formState: { errors: scheduleErrors },
  } = useForm({
    defaultValues: {
      machineId: "",
      userId: "",
      actionTaken: "",
      scheduleDate: "",
    },
  });

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm({
    defaultValues: {
      status: "Completed",
      action_taken: "",
    },
  });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await maintenanceService.getMaintenanceLogs();
      if (response.success) {
        setLogs(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
      toast.error("Failed to load maintenance records.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMachinesSelect = async () => {
    try {
      const response = await machineService.getMachines(1, 100);
      if (response.success) {
        setMachines(response.data.machines || []);
      }
    } catch (err) {
      console.error("Error loading machines for select options:", err);
    }
  };

  useEffect(() => {
    fetchLogs();
    if (canWrite) {
      fetchMachinesSelect();
    }
  }, []);

  const handleOpenSchedule = () => {
    resetSchedule({
      machineId: "",
      userId: currentUser?.id || "",
      actionTaken: "",
      scheduleDate: dayjs().add(1, "day").format("YYYY-MM-DDTHH:mm"),
    });
    setScheduleModalOpen(true);
  };

  const handleOpenEdit = (log) => {
    setActiveLog(log);
    resetEdit({
      status: log.status?.value || log.status || "Completed",
      action_taken: log.action_taken || "",
    });
    setEditModalOpen(true);
  };

  const onScheduleSubmit = async (data) => {
    setSubmittingSchedule(true);
    try {
      const payload = {
        machineId: Number(data.machineId),
        userId: Number(data.userId),
        actionTaken: data.actionTaken,
        scheduleDate: new Date(data.scheduleDate).toISOString(),
      };
      const response = await maintenanceService.scheduleMaintenance(payload);
      if (response.success) {
        toast.success("Maintenance scheduled successfully!");
        setScheduleModalOpen(false);
        fetchLogs();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to schedule task.");
    } finally {
      setSubmittingSchedule(false);
    }
  };

  const onEditSubmit = async (data) => {
    setSubmittingEdit(true);
    try {
      const response = await maintenanceService.updateMaintenanceLog(
        activeLog.id,
        data,
      );
      if (response.success) {
        toast.success("Maintenance log updated successfully!");
        setEditModalOpen(false);
        fetchLogs();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update log.");
    } finally {
      setSubmittingEdit(false);
    }
  };

  const columns = [
    {
      header: "Scheduled Date",
      accessor: "schedule_date",
      render: (row) => (
        <span>{dayjs(row.schedule_date).format("YYYY-MM-DD HH:mm")}</span>
      ),
    },
    {
      header: "Machine",
      accessor: "machine_id",
      render: (row) => (
        <span className="font-semibold text-slate-800 dark:text-slate-200">
          Machine #{row.machine_id}
        </span>
      ),
    },
    {
      header: "Assigned User",
      accessor: "user_id",
      render: (row) => <span className="text-xs">User #{row.user_id}</span>,
    },
    {
      header: "Task Action",
      accessor: "action_taken",
      render: (row) => (
        <span
          className="text-xs text-slate-500 max-w-50 truncate block"
          title={row.action_taken}
        >
          {row.action_taken}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      render: (row) => {
        const rawStatus = row.status?.value || row.status || "Scheduled";
        const statusMap = {
          Completed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
          Scheduled: "bg-brand-500/10 text-brand-500 border-brand-500/20",
          "In Progress": "bg-amber-500/10 text-amber-500 border-amber-500/20",
          Canceled: "bg-slate-500/10 text-slate-500 border-slate-550/20",
        };
        return (
          <span
            className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${statusMap[rawStatus] || statusMap.Scheduled}`}
          >
            {rawStatus}
          </span>
        );
      },
    },
    {
      header: "Action",
      accessor: "id",
      render: (row) => {
        const rawStatus = row.status?.value || row.status || "Scheduled";
        return canWrite &&
          rawStatus !== "Completed" &&
          rawStatus !== "Canceled" ? (
          <button
            onClick={() => handleOpenEdit(row)}
            className="px-2 py-1.5 bg-slate-900 hover:bg-slate-850 text-white rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all border border-slate-700/50"
          >
            <FiEdit2 /> Update
          </button>
        ) : (
          <span className="text-[10px] text-slate-400 font-medium">None</span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-850 dark:text-slate-100 flex items-center gap-2">
            <FiCalendar className="text-brand-500" /> Maintenance Logs &
            Schedules
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Schedule and audit preventative maintenance operations
          </p>
        </div>
        {canWrite && (
          <button
            onClick={handleOpenSchedule}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            <FiPlus className="w-4 h-4" /> Schedule PM Task
          </button>
        )}
      </div>

      <div className="h-[calc(100vh-210px)]">
        <DataTable
          columns={columns}
          data={logs}
          loading={loading}
          page={1}
          perPage={100} // Fetching all logs in dev context
          total={logs.length}
          emptyMessage="No maintenance schedules registered."
        />
      </div>

      {/* Schedule Modal */}
      {scheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setScheduleModalOpen(false)}
          />
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl p-6 shadow-2xl relative z-10">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-850 mb-4">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <FiCpu className="text-brand-500" /> Schedule Maintenance Task
              </h3>
              <button
                onClick={() => setScheduleModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-655 rounded"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleScheduleSubmit(onScheduleSubmit)}
              className="space-y-4"
            >
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Target Machine
                </label>
                <select
                  {...registerSchedule("machineId", {
                    required: "Machine is required",
                  })}
                  className="w-full px-3 py-2 border border-slate-250 dark:border-slate-800 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                >
                  <option value="">Select a Machine</option>
                  {machines.map((m) => (
                    <option key={m.id} value={m.id}>
                      #{m.id} - {m.machine_name} ({m.machine_code})
                    </option>
                  ))}
                </select>
                {scheduleErrors.machineId && (
                  <span className="text-xs text-red-500 font-semibold">
                    {scheduleErrors.machineId.message}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Assigned User ID
                </label>
                <input
                  type="number"
                  {...registerSchedule("userId", {
                    required: "Assigned User ID is required",
                  })}
                  className="w-full px-3 py-2 border border-slate-250 dark:border-slate-800 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Action Plan Details
                </label>
                <textarea
                  rows="3"
                  placeholder="e.g. Inspect lubrication levels and replace worn belts..."
                  {...registerSchedule("actionTaken", {
                    required: "Action plan is required",
                  })}
                  className="w-full px-3 py-2 border border-slate-250 dark:border-slate-800 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Schedule Date
                </label>
                <input
                  type="datetime-local"
                  {...registerSchedule("scheduleDate", {
                    required: "Date is required",
                  })}
                  className="w-full px-3 py-2 border border-slate-250 dark:border-slate-800 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setScheduleModalOpen(false)}
                  className="px-4 py-2 border border-slate-250 dark:border-slate-805 text-slate-655 dark:text-slate-400 rounded-lg text-sm font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSchedule}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-sm font-bold transition-all cursor-pointer"
                >
                  {submittingSchedule ? "Scheduling..." : "Schedule Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Log Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setEditModalOpen(false)}
          />
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl p-6 shadow-2xl relative z-10">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-855 mb-4">
              <h3 className="font-bold text-slate-850 dark:text-slate-100 flex items-center gap-2">
                <FiCheckCircle className="text-brand-500" /> Update Maintenance
                Log
              </h3>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-655 rounded"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleEditSubmit(onEditSubmit)}
              className="space-y-4"
            >
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Operation Status
                </label>
                <select
                  {...registerEdit("status", { required: true })}
                  className="w-full px-3 py-2 border border-slate-250 dark:border-slate-800 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Canceled">Canceled</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Execution Action Notes
                </label>
                <textarea
                  rows="3"
                  placeholder="Detail operations performed during service..."
                  {...registerEdit("action_taken")}
                  className="w-full px-3 py-2 border border-slate-250 dark:border-slate-800 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-250 dark:border-slate-800 text-slate-655 dark:text-slate-400 rounded-lg text-sm font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-sm font-bold transition-all cursor-pointer"
                >
                  {submittingEdit ? "Submitting..." : "Save Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Maintenance;
