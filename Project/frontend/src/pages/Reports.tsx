import React, { useState } from 'react';
import api from '../services/api';
import { FileSpreadsheet, FileText, Download } from 'lucide-react';

const Reports: React.FC = () => {
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);

  const handleDownload = async (type: 'predictions' | 'machines', format: 'pdf' | 'csv') => {
    const key = `${type}-${format}`;
    setDownloadingFormat(key);

    try {
      const response = await api.get('/reports', {
        params: { report_type: type, format: format },
        responseType: 'blob'
      });

      // Create a blob URL and download file
      const blob = new Blob([response.data], {
        type: format === 'pdf' ? 'application/pdf' : 'text/csv'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `${type}_report_${new Date().toISOString().slice(0, 10)}.${format}`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download report', err);
      alert('Report generation failed. Verify system permissions.');
    } finally {
      setDownloadingFormat(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
          Export & Analytics Download Center
        </h1>
        <p className="text-xs text-slate-400 mt-1">Generate compliant PDF and CSV reports for plant maintenance audits</p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Prediction History Report */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-full bg-cyan-500/10 rounded-full blur-[60px] pointer-events-none"></div>

          <div>
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-cyan-400" />
            </div>
            <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">Predictive Maintenance Audit Report</h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Includes full sensor telemetry metrics (temperatures, speed, torque, wear), predicted failure probabilities, confidence metrics, classified failure modes, and recommended maintenance directives.
            </p>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-800 flex items-center gap-3">
            <button
              onClick={() => handleDownload('predictions', 'pdf')}
              disabled={downloadingFormat === 'predictions-pdf'}
              className="flex-1 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {downloadingFormat === 'predictions-pdf' ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </>
              )}
            </button>

            <button
              onClick={() => handleDownload('predictions', 'csv')}
              disabled={downloadingFormat === 'predictions-csv'}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {downloadingFormat === 'predictions-csv' ? (
                <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Export CSV</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Card 2: Machine Asset Inventory Report */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-full bg-emerald-500/10 rounded-full blur-[60px] pointer-events-none"></div>

          <div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
              <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
            </div>
            <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">Machine Asset Inventory Report</h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Consolidated view of all factory machinery assets, serial number tags, quality type variants, floor locations, and current operational health statuses.
            </p>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-800 flex items-center gap-3">
            <button
              onClick={() => handleDownload('machines', 'pdf')}
              disabled={downloadingFormat === 'machines-pdf'}
              className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {downloadingFormat === 'machines-pdf' ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </>
              )}
            </button>

            <button
              onClick={() => handleDownload('machines', 'csv')}
              disabled={downloadingFormat === 'machines-csv'}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {downloadingFormat === 'machines-csv' ? (
                <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Export CSV</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
