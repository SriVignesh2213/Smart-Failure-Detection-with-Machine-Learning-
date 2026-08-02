import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import dayjs from "dayjs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { machineService } from "../services/machineService";
import { predictionService } from "../services/predictionService";
import { maintenanceService } from "../services/maintenanceService";
import { blackboxService } from "../services/blackboxService";
import {
  FiX,
  FiDownload,
  FiPrinter,
  FiCpu,
  FiActivity,
  FiShield,
  FiCalendar,
  FiMapPin,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiThermometer,
  FiZap,
  FiBarChart2,
} from "react-icons/fi";

// ─── Health Badge Helper ─────────────────────────────────────────────────────
const getHealthBadge = (healthScore, failureProbability, rul) => {
  const score = parseFloat(healthScore) || 0;
  const prob = parseFloat(failureProbability) || 0;
  const life = parseFloat(rul) || 9999;

  if (score >= 80 && prob < 0.4 && life > 200) {
    return {
      label: "Healthy",
      emoji: "🟢",
      cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
    };
  }
  if (score >= 50 || (prob >= 0.4 && prob < 0.7)) {
    return {
      label: "Warning",
      emoji: "🟡",
      cls: "bg-amber-500/10 text-amber-600 border-amber-500/30",
    };
  }
  return {
    label: "Critical",
    emoji: "🔴",
    cls: "bg-red-500/10 text-red-600 border-red-500/30",
  };
};

// ─── Small stat card ─────────────────────────────────────────────────────────
const StatCard = ({
  label,
  value,
  sub,
  icon: Icon,
  color = "text-brand-500 bg-brand-500/10",
}) => (
  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
    {Icon && (
      <div className={`p-2 rounded-lg ${color} shrink-0`}>
        <Icon className="w-4 h-4" />
      </div>
    )}
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="text-sm font-extrabold text-slate-800 mt-0.5 truncate">
        {value || "N/A"}
      </p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ─── No-data placeholder ──────────────────────────────────────────────────────
const NoData = ({ label }) => (
  <div className="py-6 px-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 flex flex-col items-center gap-1 text-center">
    <FiBarChart2 className="w-6 h-6 text-slate-300" />
    <p className="text-xs font-semibold text-slate-400">No Data Available</p>
    <p className="text-[10px] text-slate-300">
      {label} has not been recorded yet.
    </p>
  </div>
);

// ─── Section Header ───────────────────────────────────────────────────────────
const SectionHeader = ({
  title,
  icon: Icon,
  color = "text-brand-500 bg-brand-500/10",
}) => (
  <div className="flex items-center gap-3 mb-4 pb-2 border-b border-slate-200">
    <div className={`p-2 rounded-lg ${color}`}>
      <Icon className="w-4 h-4" />
    </div>
    <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">
      {title}
    </h3>
  </div>
);

// ─── Progress Bar ─────────────────────────────────────────────────────────────
const ProgressBar = ({ value, max = 100, color = "bg-brand-500" }) => {
  const pct = Math.min(100, Math.max(0, (parseFloat(value) / max) * 100));
  return (
    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
      <div
        className={`${color} h-full rounded-full transition-all`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};

// ─── Main Modal ───────────────────────────────────────────────────────────────
const MachineReportModal = ({
  machineId,
  machineName,
  machineCode,
  initialAction,
  onClose,
}) => {
  const [loading, setLoading] = useState(true);
  const [machine, setMachine] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [maintenanceLogs, setMaintenance] = useState([]);
  const [blackbox, setBlackbox] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const reportRef = useRef(null);
  const didAutoTrigger = useRef(false);

  const generatedAt = dayjs();

  // Fetch all data for this machine on open
  useEffect(() => {
    if (!machineId) return;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [machRes, predRes, mntRes, bbRes] = await Promise.allSettled([
          machineService.getMachine(machineId),
          predictionService.getPredictions({ machineId, page: 1, perPage: 1 }),
          maintenanceService.getMaintenanceLogs({ machineId }),
          blackboxService.getBlackboxSnapshots({
            machineId: machineId,
            page: 1,
            perPage: 1,
          }),
        ]);

        if (machRes.status === "fulfilled" && machRes.value?.success) {
          setMachine(machRes.value.data);
        }
        if (predRes.status === "fulfilled" && predRes.value?.success) {
          const preds = predRes.value.data?.predictions || [];
          setPrediction(preds[0] || null);
        }
        if (mntRes.status === "fulfilled" && mntRes.value?.success) {
          setMaintenance(mntRes.value.data || []);
        }
        if (bbRes.status === "fulfilled" && bbRes.value?.success) {
          const snaps = bbRes.value.data?.snapshots || [];
          setBlackbox(snaps[0] || null);
        }
      } catch (e) {
        console.error("Report modal fetch error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [machineId]);

  // Auto-trigger PDF / Print once data is ready
  useEffect(() => {
    if (!loading && !didAutoTrigger.current) {
      didAutoTrigger.current = true;
      if (initialAction === "pdf") {
        setTimeout(handleDownloadPDF, 300);
      } else if (initialAction === "print") {
        setTimeout(handlePrint, 300);
      }
    }
  }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Health Badge ───────────────────────────────────────────────────────────
  const badge = getHealthBadge(
    machine?.health_score ?? prediction?.health_score,
    prediction?.failure_probability,
    prediction?.remaining_useful_life,
  );

  // ── Download PDF via jsPDF & jspdf-autotable ──────────────────────────────
  const handleDownloadPDF = () => {
    setDownloading(true);
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 14;
      let y = margin;

      // Color Palette
      const primaryColor = [14, 142, 242];
      const darkColor = [15, 23, 42];
      const grayColor = [100, 116, 139];
      const borderColor = [226, 232, 240];

      const checkPageBreak = (needed = 15) => {
        if (y + needed > pageHeight - 20) {
          doc.addPage();
          y = margin;
          return true;
        }
        return false;
      };

      // Header Accent Bar & Title
      doc.setFillColor(...primaryColor);
      doc.rect(margin, y, 4, 14, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(...darkColor);
      doc.text("AI-Predictive-Maintenance", margin + 8, y + 6);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...grayColor);
      doc.text("INDUSTRIAL MACHINE HEALTH REPORT", margin + 8, y + 12);

      // Health Badge (Top Right)
      const hs = parseFloat(machine?.health_score ?? prediction?.health_score ?? 0);
      const badgeText = `${badge.label.toUpperCase()} (${hs.toFixed(1)}%)`;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);

      let badgeBg = [209, 250, 229];
      let badgeFg = [6, 95, 70];
      if (badge.label === "Warning") {
        badgeBg = [254, 243, 199];
        badgeFg = [146, 64, 14];
      } else if (badge.label === "Critical") {
        badgeBg = [254, 226, 226];
        badgeFg = [153, 27, 27];
      }

      const badgeWidth = doc.getTextWidth(badgeText) + 8;
      doc.setFillColor(...badgeBg);
      doc.roundedRect(pageWidth - margin - badgeWidth, y, badgeWidth, 7, 2, 2, "F");
      doc.setTextColor(...badgeFg);
      doc.text(badgeText, pageWidth - margin - badgeWidth + 4, y + 4.8);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...grayColor);
      doc.text(
        `Generated: ${generatedAt.format("YYYY-MM-DD HH:mm:ss")}`,
        pageWidth - margin,
        y + 13,
        { align: "right" }
      );

      y += 20;

      // Divider Line
      doc.setDrawColor(...borderColor);
      doc.setLineWidth(0.4);
      doc.line(margin, y, pageWidth - margin, y);
      y += 8;

      // Section Header Draw Helper
      const drawSectionHeader = (title) => {
        checkPageBreak(12);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...darkColor);
        doc.text(title.toUpperCase(), margin, y);
        y += 2.5;
        doc.setDrawColor(...borderColor);
        doc.setLineWidth(0.3);
        doc.line(margin, y, pageWidth - margin, y);
        y += 6;
      };

      // 1. Machine Information
      drawSectionHeader("Machine Information");
      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [["Attribute", "Value", "Attribute", "Value"]],
        body: [
          [
            "Machine Name",
            machine?.machine_name || machineName || "N/A",
            "Location",
            machine?.location || "N/A",
          ],
          [
            "Machine Code",
            machine?.machine_code || machineCode || "N/A",
            "Manufacturer",
            machine?.manufacturer || "N/A",
          ],
          [
            "Machine Type",
            machine?.machine_type || "N/A",
            "Model Number",
            machine?.model_number || "N/A",
          ],
          [
            "Department",
            machine?.department || "N/A",
            "Current Status",
            machine?.status || "N/A",
          ],
        ],
        theme: "plain",
        styles: { fontSize: 8.5, cellPadding: 3.5, textColor: [30, 41, 59] },
        headStyles: { fillColor: [241, 245, 249], textColor: [71, 85, 105], fontStyle: "bold" },
        columnStyles: {
          0: { fontStyle: "bold", textColor: [100, 116, 139], cellWidth: 40 },
          1: { fontStyle: "normal", cellWidth: 51 },
          2: { fontStyle: "bold", textColor: [100, 116, 139], cellWidth: 40 },
          3: { fontStyle: "normal", cellWidth: 51 },
        },
      });
      y = doc.lastAutoTable.finalY + 8;

      // 2. Prediction & Health Summary
      drawSectionHeader("Health Summary & AI Prediction");
      if (prediction) {
        autoTable(doc, {
          startY: y,
          margin: { left: margin, right: margin },
          head: [["Metric", "Value", "Metric", "Value"]],
          body: [
            [
              "Health Score",
              `${parseFloat(prediction.health_score ?? machine?.health_score ?? 0).toFixed(1)}%`,
              "Remaining Useful Life",
              prediction.remaining_useful_life != null
                ? `${parseFloat(prediction.remaining_useful_life).toFixed(0)} Hours`
                : "N/A",
            ],
            [
              "Failure Probability",
              prediction.failure_probability != null
                ? `${(prediction.failure_probability * 100).toFixed(1)}%`
                : "N/A",
              "Risk Level",
              prediction.status || "N/A",
            ],
            [
              "Predicted Failure Type",
              prediction.predicted_failure_type || "None Detected",
              "Inference Status",
              "Active Engine",
            ],
          ],
          theme: "plain",
          styles: { fontSize: 8.5, cellPadding: 3.5, textColor: [30, 41, 59] },
          headStyles: { fillColor: [241, 245, 249], textColor: [71, 85, 105], fontStyle: "bold" },
          columnStyles: {
            0: { fontStyle: "bold", textColor: [100, 116, 139], cellWidth: 40 },
            1: { fontStyle: "bold", textColor: [15, 23, 42], cellWidth: 51 },
            2: { fontStyle: "bold", textColor: [100, 116, 139], cellWidth: 40 },
            3: { fontStyle: "bold", textColor: [15, 23, 42], cellWidth: 51 },
          },
        });
        y = doc.lastAutoTable.finalY + 8;
      } else {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8.5);
        doc.setTextColor(...grayColor);
        doc.text("No Data Available — Prediction data has not been recorded yet.", margin, y + 2);
        y += 10;
      }

      // 3. Sensor Readings
      drawSectionHeader("Latest Sensor Readings");
      if (prediction) {
        autoTable(doc, {
          startY: y,
          margin: { left: margin, right: margin },
          head: [["Sensor Type", "Reading", "Sensor Type", "Reading"]],
          body: [
            [
              "Temperature",
              prediction.sensor_temperature != null
                ? `${parseFloat(prediction.sensor_temperature).toFixed(1)} °C`
                : "N/A",
              "RPM",
              prediction.sensor_rpm != null
                ? `${parseFloat(prediction.sensor_rpm).toFixed(0)} RPM`
                : "N/A",
            ],
            [
              "Vibration",
              prediction.sensor_vibration != null
                ? `${parseFloat(prediction.sensor_vibration).toFixed(2)} mm/s`
                : "N/A",
              "Voltage",
              prediction.sensor_voltage != null
                ? `${parseFloat(prediction.sensor_voltage).toFixed(1)} V`
                : "N/A",
            ],
            [
              "Pressure",
              prediction.sensor_pressure != null
                ? `${parseFloat(prediction.sensor_pressure).toFixed(1)} PSI`
                : "N/A",
              "Current",
              prediction.sensor_current != null
                ? `${parseFloat(prediction.sensor_current).toFixed(1)} A`
                : "N/A",
            ],
          ],
          theme: "plain",
          styles: { fontSize: 8.5, cellPadding: 3.5, textColor: [30, 41, 59] },
          headStyles: { fillColor: [241, 245, 249], textColor: [71, 85, 105], fontStyle: "bold" },
          columnStyles: {
            0: { fontStyle: "bold", textColor: [100, 116, 139], cellWidth: 40 },
            1: { fontStyle: "normal", cellWidth: 51 },
            2: { fontStyle: "bold", textColor: [100, 116, 139], cellWidth: 40 },
            3: { fontStyle: "normal", cellWidth: 51 },
          },
        });
        y = doc.lastAutoTable.finalY + 8;
      } else {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8.5);
        doc.setTextColor(...grayColor);
        doc.text("No Data Available — Sensor telemetry has not been recorded yet.", margin, y + 2);
        y += 10;
      }

      // 4. Maintenance History
      drawSectionHeader("Maintenance History");
      if (maintenanceLogs && maintenanceLogs.length > 0) {
        const tableBody = maintenanceLogs.map((log, index) => [
          `#${log.id || index + 1}`,
          log.action_taken || "N/A",
          log.status || "N/A",
          log.schedule_date ? dayjs(log.schedule_date).format("YYYY-MM-DD") : "N/A",
        ]);

        autoTable(doc, {
          startY: y,
          margin: { left: margin, right: margin },
          head: [["# Log ID", "Action Taken", "Status", "Service Date"]],
          body: tableBody,
          theme: "striped",
          styles: { fontSize: 8.5, cellPadding: 3.5, textColor: [30, 41, 59] },
          headStyles: { fillColor: [14, 142, 242], textColor: [255, 255, 255], fontStyle: "bold" },
          columnStyles: {
            0: { cellWidth: 25, fontStyle: "bold" },
            1: { cellWidth: 90 },
            2: { cellWidth: 35, fontStyle: "bold" },
            3: { cellWidth: 32 },
          },
        });
        y = doc.lastAutoTable.finalY + 8;
      } else {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8.5);
        doc.setTextColor(...grayColor);
        doc.text("No Data Available — Maintenance history has not been recorded yet.", margin, y + 2);
        y += 10;
      }

      // 5. Failure Black Box
      drawSectionHeader("Failure Black Box Incidents");
      if (blackbox) {
        autoTable(doc, {
          startY: y,
          margin: { left: margin, right: margin },
          head: [["Attribute", "Details"]],
          body: [
            ["Snapshot ID", `#${blackbox.id}`],
            ["Incident Status", blackbox.resolved ? "Resolved" : "Active"],
            ["Trigger Event", blackbox.trigger_event || "N/A"],
            ["Resolution / Root Cause", blackbox.resolution_notes || "N/A"],
            [
              "Recorded At",
              blackbox.created_at
                ? dayjs(blackbox.created_at).format("YYYY-MM-DD HH:mm")
                : "N/A",
            ],
          ],
          theme: "plain",
          styles: { fontSize: 8.5, cellPadding: 3.5, textColor: [30, 41, 59] },
          headStyles: { fillColor: [241, 245, 249], textColor: [71, 85, 105], fontStyle: "bold" },
          columnStyles: {
            0: { fontStyle: "bold", textColor: [100, 116, 139], cellWidth: 45 },
            1: { fontStyle: "normal", cellWidth: 137 },
          },
        });
        y = doc.lastAutoTable.finalY + 8;
      } else {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8.5);
        doc.setTextColor(...grayColor);
        doc.text("No Data Available — Failure Black Box incidents have not been recorded yet.", margin, y + 2);
        y += 10;
      }

      // Page numbers & Footer on all pages
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);

        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

        doc.text("AI-Predictive-Maintenance — Confidential Industrial Health Report", margin, pageHeight - 7);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: "right" });
      }

      // Exact PDF filename format required:
      const filename = `Machine_Report_${machineCode || machineId}_${generatedAt.format("YYYYMMDD")}.pdf`;
      doc.save(filename);
    } catch (e) {
      console.error("PDF generation error:", e);
    } finally {
      setDownloading(false);
    }
  };

  // ── Print Report ──────────────────────────────────────────────────────────
  const handlePrint = () => {
    if (!reportRef.current) return;
    const printContents = reportRef.current.innerHTML;
    const printWindow = window.open("", "_blank", "width=900,height=700");
    printWindow.document.write(`
      <html>
        <head>
          <title>Machine Report – ${machineCode || machineId} – ${generatedAt.format("YYYY-MM-DD")}</title>
          <style>
            *{box-sizing:border-box;margin:0;padding:0}
            body{font-family:Outfit,system-ui,sans-serif;font-size:12px;color:#1e293b;padding:20px;background:#fff}
            h1,h2,h3{font-weight:800;color:#0f172a}
            .print-hidden{display:none!important}
            .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px}
            .grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:16px}
            .card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px;break-inside:avoid}
            .badge{display:inline-block;padding:3px 10px;border-radius:99px;font-size:10px;font-weight:700;border:1px solid}
            .badge-green{background:#d1fae5;color:#065f46;border-color:#6ee7b7}
            .badge-amber{background:#fef3c7;color:#92400e;border-color:#fcd34d}
            .badge-red{background:#fee2e2;color:#991b1b;border-color:#fca5a5}
            .section-title{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#475569;border-bottom:2px solid #e2e8f0;padding-bottom:6px;margin-bottom:10px}
            .label{font-size:10px;color:#94a3b8;font-weight:700;text-transform:uppercase;margin-bottom:2px}
            .value{font-size:13px;font-weight:700;color:#1e293b}
            .progress-bg{background:#e2e8f0;border-radius:99px;height:8px;overflow:hidden;margin-top:4px}
            .progress-bar{background:#0e8ef2;height:100%;border-radius:99px}
            .footer{margin-top:24px;border-top:2px solid #e2e8f0;padding-top:12px;display:flex;justify-content:space-between;color:#94a3b8;font-size:10px}
            @media print{body{padding:0}@page{margin:14mm}}
          </style>
        </head>
        <body>${printContents}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 600);
  };

  // ── Health score color ──────────────────────────────────────────────────
  const healthScore = parseFloat(
    machine?.health_score ?? prediction?.health_score ?? 0,
  );
  const healthColor =
    healthScore >= 80
      ? "bg-emerald-500"
      : healthScore >= 50
        ? "bg-amber-500"
        : "bg-red-500";
  const latestMaintenance = maintenanceLogs[0];

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        transition={{ duration: 0.25 }}
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-600">
              <FiCpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-slate-900">
                Machine Report Preview
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                {machineCode || `#${machineId}`} &mdash; {machineName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              disabled={downloading || loading}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <FiDownload className="w-4 h-4" />
              {downloading ? "Generating..." : "Download PDF"}
            </button>
            <button
              onClick={handlePrint}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
            >
              <FiPrinter className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Report Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400 font-semibold">
                Compiling machine report...
              </p>
            </div>
          ) : (
            /* ══════════════════ PRINTABLE / PDF CONTENT ══════════════════ */
            <div
              ref={reportRef}
              className="space-y-6 font-sans text-slate-800 bg-white"
            >
              {/* ── REPORT HEADER ─────────────────────────────────────────── */}
              <div className="flex items-start justify-between pb-5 border-b-2 border-slate-200">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FiCpu className="w-6 h-6 text-brand-600" />
                    <h1 className="font-black text-xl text-slate-900 tracking-tight">
                      AI-Predictive-Maintenance
                    </h1>
                  </div>
                  <p className="text-[11px] font-mono text-slate-500 uppercase tracking-widest">
                    Industrial Machine Health Report
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <div
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-extrabold ${badge.cls}`}
                  >
                    <span>{badge.emoji}</span>
                    <span>{badge.label}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono block mt-1">
                    Generated: {generatedAt.format("YYYY-MM-DD HH:mm:ss")}
                  </p>
                </div>
              </div>

              {/* ── MACHINE INFORMATION ────────────────────────────────────── */}
              <div>
                <SectionHeader title="Machine Information" icon={FiCpu} />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard
                    label="Machine Name"
                    value={machine?.machine_name || machineName}
                    icon={FiCpu}
                  />
                  <StatCard
                    label="Machine Code"
                    value={machine?.machine_code || machineCode}
                    icon={FiCpu}
                    color="text-slate-600 bg-slate-100"
                  />
                  <StatCard
                    label="Machine Type"
                    value={machine?.machine_type}
                    icon={FiActivity}
                    color="text-purple-600 bg-purple-100"
                  />
                  <StatCard
                    label="Department"
                    value={machine?.department}
                    icon={FiMapPin}
                    color="text-indigo-600 bg-indigo-100"
                  />
                  <StatCard
                    label="Location"
                    value={machine?.location}
                    icon={FiMapPin}
                    color="text-cyan-600 bg-cyan-100"
                  />
                  <StatCard
                    label="Manufacturer"
                    value={machine?.manufacturer}
                    icon={FiCpu}
                    color="text-orange-600 bg-orange-100"
                  />
                  <StatCard
                    label="Model Number"
                    value={machine?.model_number}
                    icon={FiCpu}
                    color="text-teal-600 bg-teal-100"
                  />
                  <StatCard
                    label="Current Status"
                    value={machine?.status}
                    icon={
                      machine?.status === "Active"
                        ? FiCheckCircle
                        : FiAlertTriangle
                    }
                    color={
                      machine?.status === "Active"
                        ? "text-emerald-600 bg-emerald-100"
                        : "text-red-600 bg-red-100"
                    }
                  />
                </div>
              </div>

              {/* ── HEALTH SUMMARY ─────────────────────────────────────────── */}
              <div>
                <SectionHeader
                  title="Health Summary"
                  icon={FiActivity}
                  color="text-emerald-600 bg-emerald-100"
                />
                {prediction ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <StatCard
                        label="Health Score"
                        value={`${parseFloat(prediction.health_score ?? machine?.health_score ?? 0).toFixed(1)}%`}
                        icon={FiActivity}
                        color="text-emerald-600 bg-emerald-100"
                      />
                      <StatCard
                        label="Failure Probability"
                        value={
                          prediction.failure_probability != null
                            ? `${(prediction.failure_probability * 100).toFixed(1)}%`
                            : "N/A"
                        }
                        icon={FiAlertTriangle}
                        color="text-red-600 bg-red-100"
                      />
                      <StatCard
                        label="Remaining Useful Life"
                        value={
                          prediction.remaining_useful_life != null
                            ? `${parseFloat(prediction.remaining_useful_life).toFixed(0)} Hours`
                            : "N/A"
                        }
                        icon={FiClock}
                        color="text-brand-600 bg-brand-100"
                      />
                      <StatCard
                        label="Risk Level"
                        value={prediction.status}
                        icon={FiShield}
                        color={
                          prediction.status === "Critical"
                            ? "text-red-600 bg-red-100"
                            : prediction.status === "Warning"
                              ? "text-amber-600 bg-amber-100"
                              : "text-emerald-600 bg-emerald-100"
                        }
                      />
                    </div>
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                      <p className="text-[10px] font-bold uppercase text-slate-500 mb-1.5">
                        Machine Health Score
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <ProgressBar
                            value={healthScore}
                            max={100}
                            color={healthColor}
                          />
                        </div>
                        <span className="font-black text-sm text-slate-800 w-12 text-right">
                          {healthScore.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    {prediction.predicted_failure_type && (
                      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                        <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">
                          Predicted Failure Type
                        </p>
                        <p className="text-sm font-bold text-slate-800">
                          {prediction.predicted_failure_type}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <NoData label="Prediction / Health" />
                )}
              </div>

              {/* ── SENSOR INFORMATION ─────────────────────────────────────── */}
              <div>
                <SectionHeader
                  title="Latest Sensor Readings"
                  icon={FiThermometer}
                  color="text-cyan-600 bg-cyan-100"
                />
                {prediction ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      {
                        label: "Temperature",
                        value:
                          prediction.sensor_temperature != null
                            ? `${parseFloat(prediction.sensor_temperature).toFixed(1)} °C`
                            : null,
                        icon: FiThermometer,
                      },
                      {
                        label: "Vibration",
                        value:
                          prediction.sensor_vibration != null
                            ? `${parseFloat(prediction.sensor_vibration).toFixed(2)} mm/s`
                            : null,
                        icon: FiActivity,
                      },
                      {
                        label: "Pressure",
                        value:
                          prediction.sensor_pressure != null
                            ? `${parseFloat(prediction.sensor_pressure).toFixed(1)} PSI`
                            : null,
                        icon: FiBarChart2,
                      },
                      {
                        label: "RPM",
                        value:
                          prediction.sensor_rpm != null
                            ? `${parseFloat(prediction.sensor_rpm).toFixed(0)} RPM`
                            : null,
                        icon: FiZap,
                      },
                      {
                        label: "Voltage",
                        value:
                          prediction.sensor_voltage != null
                            ? `${parseFloat(prediction.sensor_voltage).toFixed(1)} V`
                            : null,
                        icon: FiZap,
                      },
                      {
                        label: "Current",
                        value:
                          prediction.sensor_current != null
                            ? `${parseFloat(prediction.sensor_current).toFixed(1)} A`
                            : null,
                        icon: FiZap,
                      },
                    ]
                      .filter((s) => s.value)
                      .map((s, i) => (
                        <StatCard
                          key={i}
                          label={s.label}
                          value={s.value}
                          icon={s.icon}
                          color="text-cyan-600 bg-cyan-100"
                        />
                      ))}
                    {!prediction.sensor_temperature &&
                      !prediction.sensor_vibration && (
                        <div className="col-span-full">
                          <NoData label="Sensor telemetry" />
                        </div>
                      )}
                  </div>
                ) : (
                  <NoData label="Sensor telemetry" />
                )}
              </div>

              {/* ── MAINTENANCE INFORMATION ────────────────────────────────── */}
              <div>
                <SectionHeader
                  title="Maintenance Summary"
                  icon={FiCalendar}
                  color="text-amber-600 bg-amber-100"
                />
                {maintenanceLogs.length > 0 ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <StatCard
                        label="Last Maintenance"
                        value={
                          latestMaintenance?.schedule_date
                            ? dayjs(latestMaintenance.schedule_date).format(
                                "YYYY-MM-DD",
                              )
                            : "N/A"
                        }
                        icon={FiCalendar}
                        color="text-amber-600 bg-amber-100"
                      />
                      <StatCard
                        label="Last Status"
                        value={latestMaintenance?.status}
                        icon={FiCheckCircle}
                        color={
                          latestMaintenance?.status === "Completed"
                            ? "text-emerald-600 bg-emerald-100"
                            : "text-amber-600 bg-amber-100"
                        }
                      />
                      <StatCard
                        label="Total Log Entries"
                        value={maintenanceLogs.length}
                        icon={FiCalendar}
                        color="text-slate-600 bg-slate-100"
                      />
                    </div>
                    <div className="rounded-xl border border-slate-200 overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          <tr>
                            <th className="px-4 py-2.5 text-left">#</th>
                            <th className="px-4 py-2.5 text-left">
                              Action Taken
                            </th>
                            <th className="px-4 py-2.5 text-left">Status</th>
                            <th className="px-4 py-2.5 text-left">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {maintenanceLogs.slice(0, 5).map((log, i) => (
                            <tr key={log.id || i} className="hover:bg-slate-50">
                              <td className="px-4 py-2 font-mono font-bold text-slate-500">
                                #{log.id || i + 1}
                              </td>
                              <td className="px-4 py-2 text-slate-700 max-w-50 truncate">
                                {log.action_taken || "N/A"}
                              </td>
                              <td className="px-4 py-2">
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                                    log.status === "Completed"
                                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                      : log.status === "Scheduled"
                                        ? "bg-brand-500/10 text-brand-600 border-brand-500/20"
                                        : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                  }`}
                                >
                                  {log.status}
                                </span>
                              </td>
                              <td className="px-4 py-2 font-mono text-slate-500">
                                {log.schedule_date
                                  ? dayjs(log.schedule_date).format(
                                      "YYYY-MM-DD",
                                    )
                                  : "N/A"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <NoData label="Maintenance history" />
                )}
              </div>

              {/* ── FAILURE BLACK BOX ─────────────────────────────────────── */}
              <div>
                <SectionHeader
                  title="Failure Black Box"
                  icon={FiShield}
                  color="text-red-600 bg-red-100"
                />
                {blackbox ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <StatCard
                        label="Snapshot ID"
                        value={`#${blackbox.id}`}
                        icon={FiShield}
                        color="text-red-600 bg-red-100"
                      />
                      <StatCard
                        label="Incident Status"
                        value={blackbox.resolved ? "Resolved" : "Active"}
                        icon={
                          blackbox.resolved ? FiCheckCircle : FiAlertTriangle
                        }
                        color={
                          blackbox.resolved
                            ? "text-emerald-600 bg-emerald-100"
                            : "text-red-600 bg-red-100"
                        }
                      />
                      <StatCard
                        label="Recorded At"
                        value={
                          blackbox.created_at
                            ? dayjs(blackbox.created_at).format(
                                "YYYY-MM-DD HH:mm",
                              )
                            : "N/A"
                        }
                        icon={FiClock}
                        color="text-slate-600 bg-slate-100"
                      />
                    </div>
                    <div className="p-4 rounded-xl border border-red-200 bg-red-50 space-y-2">
                      <div>
                        <p className="text-[10px] font-bold uppercase text-red-400 mb-1">
                          Trigger Event
                        </p>
                        <p className="text-sm font-bold text-red-800">
                          {blackbox.trigger_event || "N/A"}
                        </p>
                      </div>
                      {blackbox.resolution_notes && (
                        <div>
                          <p className="text-[10px] font-bold uppercase text-red-400 mb-1">
                            Resolution / Root Cause
                          </p>
                          <p className="text-xs text-red-700">
                            {blackbox.resolution_notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <NoData label="Failure Black Box incidents" />
                )}
              </div>

              {/* ── REPORT FOOTER ─────────────────────────────────────────── */}
              <div className="flex items-center justify-between pt-4 border-t-2 border-slate-200 text-[10px] text-slate-400 font-mono">
                <div>
                  <span className="font-bold text-slate-500">
                    AI-Predictive-Maintenance
                  </span>{" "}
                  &mdash; Industrial Health Report
                </div>
                <div className="text-right">
                  <span>
                    Generated:{" "}
                    {generatedAt.format("YYYY-MM-DD HH:mm:ss UTC+5:30")}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default MachineReportModal;
