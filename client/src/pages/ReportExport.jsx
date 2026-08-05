import React from 'react';
import { Download, FileText, FileSpreadsheet, Printer } from 'lucide-react';

const ReportExport = ({ data }) => {
  if (!data) return null;

  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportEventsCSV = () => {
    const list = data.eventPerformance || [];
    let csv = 'Event Title,Category,Capacity,Registrations,Attendance Pct,Rating,Status\n';
    list.forEach((ev) => {
      csv += `"${ev.title}","${ev.category}",${ev.capacity},${ev.registrations},${ev.attendancePct}%,${ev.rating},"${ev.status}"\n`;
    });
    downloadCSV(csv, 'svec_event_performance.csv');
  };

  const handleExportStudentsCSV = () => {
    const list = data.topStudents || [];
    let csv = 'Student Name,Roll Number,Department,Events Attended,Volunteer Hours,Leaderboard Points\n';
    list.forEach((ts) => {
      csv += `"${ts.name}","${ts.rollNumber}","${ts.department}",${ts.eventsAttended},${ts.volunteerHours},${ts.points}\n`;
    });
    downloadCSV(csv, 'svec_student_analytics.csv');
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-250 shadow-xs space-y-5 animate-in fade-in duration-200">
      
      <div>
        <h3 className="text-sm font-bold text-gray-950 uppercase tracking-wider">Executive BI Report Generator</h3>
        <p className="text-xs text-gray-450 font-semibold mt-1">Export filtered metrics grids or trigger print formats to save PDF sheets.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* CSV Events */}
        <button
          onClick={handleExportEventsCSV}
          className="flex flex-col items-center justify-center p-6 border border-gray-200 hover:border-primary-500 rounded-2xl hover:bg-gray-50 transition text-center space-y-2 group focus:outline-none"
        >
          <FileSpreadsheet className="h-8 w-8 text-primary-650 group-hover:scale-110 transition" />
          <span className="text-xs font-bold text-gray-900">Event Performance CSV</span>
          <span className="text-[10px] text-gray-450 font-semibold">Download capacity logs</span>
        </button>

        {/* CSV Students */}
        <button
          onClick={handleExportStudentsCSV}
          className="flex flex-col items-center justify-center p-6 border border-gray-200 hover:border-primary-500 rounded-2xl hover:bg-gray-50 transition text-center space-y-2 group focus:outline-none"
        >
          <FileSpreadsheet className="h-8 w-8 text-purple-650 group-hover:scale-110 transition" />
          <span className="text-xs font-bold text-gray-900">Student Leaderboard CSV</span>
          <span className="text-[10px] text-gray-450 font-semibold">Download XP scoring logs</span>
        </button>

        {/* Print PDF */}
        <button
          onClick={handlePrintPDF}
          className="flex flex-col items-center justify-center p-6 border border-gray-200 hover:border-primary-500 rounded-2xl hover:bg-gray-50 transition text-center space-y-2 group focus:outline-none"
        >
          <Printer className="h-8 w-8 text-emerald-650 group-hover:scale-110 transition" />
          <span className="text-xs font-bold text-gray-900">Print executive report (PDF)</span>
          <span className="text-[10px] text-gray-450 font-semibold">Print layouts to PDF files</span>
        </button>

      </div>

    </div>
  );
};

export default ReportExport;
