import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { reportService } from '../services/reportService';
import DataTable from '../components/DataTable';
import MachineReportModal from '../components/MachineReportModal';
import { toast } from 'react-hot-toast';
import { FiFileText, FiDownload, FiEye, FiPrinter } from 'react-icons/fi';
import dayjs from 'dayjs';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('maintenance');
  const [maintenanceReport, setMaintenanceReport] = useState([]);
  const [failuresReport, setFailuresReport] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // ── Report Preview Modal State ───────────────────────────────────────────
  const [selectedMachine, setSelectedMachine] = useState(null); // { id, name, code }
  const [modalAction, setModalAction] = useState(null);         // 'view' | 'pdf' | 'print'

  const fetchReportData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'maintenance') {
        const response = await reportService.getMaintenanceReportData();
        if (response.success) {
          setMaintenanceReport(response.data || []);
        }
      } else {
        const response = await reportService.getFailuresReportData();
        if (response.success) {
          setFailuresReport(response.data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching report details:', error);
      toast.error('Failed to load report data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [activeTab]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      let result;
      if (activeTab === 'maintenance') {
        result = await reportService.downloadMaintenanceReportCSV();
      } else {
        result = await reportService.downloadFailuresReportCSV();
      }

      if (result && !result.success) {
        toast.error(result.message || 'CSV download failed.');
      } else {
        toast.success('CSV report compiled and downloaded successfully!');
      }
    } catch (error) {
      toast.error('Failed to export CSV report.');
    } finally {
      setDownloading(false);
    }
  };

  // ── Open modal helper ───────────────────────────────────────────────────
  const openModal = (row, action) => {
    setSelectedMachine({
      id:   row['Machine ID'],
      name: row['Machine Name'],
      code: row['Machine Code'] || `MC-${row['Machine ID']}`
    });
    setModalAction(action);
  };

  const closeModal = () => {
    setSelectedMachine(null);
    setModalAction(null);
  };

  // ── Actions column (shared for both tables) ─────────────────────────────
  const actionsColumn = {
    header: 'Actions',
    accessor: '__actions',
    render: (row) => (
      <div className="flex items-center gap-1.5">
        {/* 👁 View Report */}
        <button
          onClick={(e) => { e.stopPropagation(); openModal(row, 'view'); }}
          title="View Report"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 text-[10px] font-bold transition-all cursor-pointer border border-brand-500/20"
        >
          <FiEye className="w-3 h-3" />
          View
        </button>
        {/* 📄 Download PDF */}
        <button
          onClick={(e) => { e.stopPropagation(); openModal(row, 'pdf'); }}
          title="Download PDF Report"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 text-[10px] font-bold transition-all cursor-pointer border border-emerald-500/20"
        >
          <FiDownload className="w-3 h-3" />
          PDF
        </button>
        {/* 🖨 Print */}
        <button
          onClick={(e) => { e.stopPropagation(); openModal(row, 'print'); }}
          title="Print Report"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-200/80 hover:bg-slate-300/80 text-slate-600 text-[10px] font-bold transition-all cursor-pointer border border-slate-300"
        >
          <FiPrinter className="w-3 h-3" />
          Print
        </button>
      </div>
    )
  };

  const maintenanceColumns = [
    {
      header: 'Log ID',
      accessor: 'Log ID',
      render: (row) => <span className="font-bold">#LOG-{row['Log ID']}</span>
    },
    {
      header: 'Machine ID',
      accessor: 'Machine ID',
      render: (row) => <span className="font-semibold">Machine #{row['Machine ID']}</span>
    },
    {
      header: 'Machine Name',
      accessor: 'Machine Name'
    },
    {
      header: 'Engineer Name',
      accessor: 'Engineer Name'
    },
    {
      header: 'Action Taken',
      accessor: 'Action Taken',
      render: (row) => <span className="text-xs max-w-50 truncate block" title={row['Action Taken']}>{row['Action Taken']}</span>
    },
    {
      header: 'Status',
      accessor: 'Status',
      render: (row) => {
        const statusMap = {
          Completed:    'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
          Scheduled:    'bg-brand-500/10 text-brand-500 border-brand-500/20',
          'In Progress': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
          Canceled:     'bg-slate-500/10 text-slate-500 border-slate-550/20'
        };
        return (
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${statusMap[row.Status] || statusMap.Scheduled}`}>
            {row.Status}
          </span>
        );
      }
    },
    {
      header: 'Service Date',
      accessor: 'Maintenance Date',
      render: (row) => <span>{row['Maintenance Date'] !== 'N/A' ? dayjs(row['Maintenance Date']).format('YYYY-MM-DD HH:mm') : 'N/A'}</span>
    },
    actionsColumn
  ];

  const failureColumns = [
    {
      header: 'Snapshot ID',
      accessor: 'Snapshot ID',
      render: (row) => <span className="font-bold">#SNAP-{row['Snapshot ID']}</span>
    },
    {
      header: 'Machine ID',
      accessor: 'Machine ID',
      render: (row) => <span className="font-semibold">Machine #{row['Machine ID']}</span>
    },
    {
      header: 'Machine Name',
      accessor: 'Machine Name'
    },
    {
      header: 'Trigger Event',
      accessor: 'Trigger Event',
      render: (row) => <span className="text-xs max-w-62.5 truncate block" title={row['Trigger Event']}>{row['Trigger Event']}</span>
    },
    {
      header: 'Status',
      accessor: 'Status',
      render: (row) => (
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
          row.Status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
        }`}>
          {row.Status}
        </span>
      )
    },
    {
      header: 'Recorded At',
      accessor: 'Recorded At',
      render: (row) => <span>{row['Recorded At'] !== 'N/A' ? dayjs(row['Recorded At']).format('YYYY-MM-DD HH:mm') : 'N/A'}</span>
    },
    actionsColumn
  ];

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-850 dark:text-slate-100 flex items-center gap-2">
            <FiFileText className="text-brand-500" /> Operational Reports &amp; Exports
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Audit, export, and download comprehensive logs for compliance and analytics</p>
        </div>

        <button
          onClick={handleDownload}
          disabled={downloading || loading}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-brand-600/10"
        >
          <FiDownload /> {downloading ? 'Downloading...' : 'Export CSV'}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex gap-4 text-xs font-bold uppercase tracking-wider">
        <button
          onClick={() => setActiveTab('maintenance')}
          className={`pb-3 transition-colors relative cursor-pointer ${
            activeTab === 'maintenance' ? 'text-brand-500 border-b-2 border-brand-500' : 'text-slate-400 hover:text-slate-655'
          }`}
        >
          Maintenance Logs Report
        </button>
        <button
          onClick={() => setActiveTab('failures')}
          className={`pb-3 transition-colors relative cursor-pointer ${
            activeTab === 'failures' ? 'text-brand-500 border-b-2 border-brand-500' : 'text-slate-400 hover:text-slate-655'
          }`}
        >
          Machine Failures Report
        </button>
      </div>

      <div className="h-[calc(100vh-270px)]">
        <DataTable
          columns={activeTab === 'maintenance' ? maintenanceColumns : failureColumns}
          data={activeTab === 'maintenance' ? maintenanceReport : failuresReport}
          loading={loading}
          page={1}
          perPage={1000}
          total={activeTab === 'maintenance' ? maintenanceReport.length : failuresReport.length}
          emptyMessage="No logs compiled in this reporting cycle."
        />
      </div>

      {/* ── Machine Report Preview Modal ────────────────────────────────── */}
      <AnimatePresence>
        {selectedMachine && (
          <MachineReportModal
            machineId={selectedMachine.id}
            machineName={selectedMachine.name}
            machineCode={selectedMachine.code}
            initialAction={modalAction}
            onClose={closeModal}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Reports;
