import React from 'react';
import ExportButton from '../components/ExportButton';
import { Download, FileSpreadsheet, Users, CheckSquare, Calendar } from 'lucide-react';

const ExportReports = () => {
  return (
    <div className="flex-grow bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Download className="h-8 w-8 text-primary-600" />
            Centralized Reports Export Portal
          </h1>
          <p className="text-sm text-gray-500 mt-1">Download CSV/Excel data audit logs for Events, Participants, and Attendance.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Events */}
          <div className="bg-white p-6 rounded-2xl border border-gray-250 shadow-xs flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="bg-primary-50 text-primary-700 p-3 rounded-xl w-fit border border-primary-100">
                <Calendar className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-950">Events Master Report</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Export complete campus events metadata, capacities, venues, registration deadlines, and status indicators.
              </p>
            </div>
            <ExportButton
              endpoint="/export/events"
              filename="events_master_report.csv"
              label="Download Events CSV"
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 rounded-xl text-xs transition duration-150 flex items-center justify-center gap-2"
            />
          </div>

          {/* Card 2: Participants */}
          <div className="bg-white p-6 rounded-2xl border border-gray-250 shadow-xs flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="bg-green-50 text-green-700 p-3 rounded-xl w-fit border border-green-100">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-950">Participants Master Report</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Export student registration records, academic departments, roll numbers, and active/cancelled signup statuses.
              </p>
            </div>
            <ExportButton
              endpoint="/export/participants"
              filename="participants_master_report.csv"
              label="Download Participants CSV"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-xl text-xs transition duration-150 flex items-center justify-center gap-2"
            />
          </div>

          {/* Card 3: Attendance */}
          <div className="bg-white p-6 rounded-2xl border border-gray-250 shadow-xs flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="bg-purple-50 text-purple-700 p-3 rounded-xl w-fit border border-purple-100">
                <CheckSquare className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-950">Attendance Audit Report</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Export attendance logs containing Present/Absent statuses, timestamps, and student roll numbers.
              </p>
            </div>
            <ExportButton
              endpoint="/export/attendance"
              filename="attendance_audit_report.csv"
              label="Download Attendance CSV"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl text-xs transition duration-150 flex items-center justify-center gap-2"
            />
          </div>

        </div>

      </div>
    </div>
  );
};

export default ExportReports;
