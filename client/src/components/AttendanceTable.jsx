import React from 'react';
import { User, CheckCircle2, XCircle, Clock } from 'lucide-react';

const AttendanceTable = ({ participants, onMarkAttendance }) => {
  if (!participants || participants.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-250 p-8 text-gray-500">
        <p className="font-semibold text-gray-700">No participants registered for this event yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-left text-sm text-gray-900">
          <thead className="bg-gray-50 text-xs font-bold text-gray-700 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Student Info</th>
              <th className="px-6 py-4">Academic Details</th>
              <th className="px-6 py-4">Registration Date</th>
              <th className="px-6 py-4">Attendance Status</th>
              <th className="px-6 py-4 text-right">Quick Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {participants.map((reg) => {
              const student = reg.Student;
              const attendance = reg.Attendance;
              const currentStatus = attendance ? attendance.attendanceStatus : 'Unmarked';

              return (
                <tr key={reg.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary-50 text-primary-700 p-2 rounded-full border border-primary-100 shrink-0">
                        <User className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-950">{student?.fullName || 'N/A'}</div>
                        <div className="text-xs text-gray-500">Roll: {student?.rollNumber || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                    <div className="font-medium text-xs text-gray-900">{student?.department}</div>
                    <div className="text-xs text-gray-500">{student?.year}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-650">
                    {new Date(reg.registrationDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {currentStatus === 'Present' ? (
                      <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 text-xs font-bold px-2.5 py-1 rounded-full">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Present</span>
                      </span>
                    ) : currentStatus === 'Absent' ? (
                      <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 text-xs font-bold px-2.5 py-1 rounded-full">
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Absent</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 border border-gray-250 text-xs font-medium px-2.5 py-1 rounded-full">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Unmarked</span>
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                    <button
                      onClick={() => onMarkAttendance(reg.id, 'Present')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition duration-150 border ${
                        currentStatus === 'Present'
                          ? 'bg-green-600 text-white border-green-600 shadow-xs'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-green-50 hover:text-green-700 hover:border-green-200'
                      }`}
                    >
                      Present
                    </button>
                    <button
                      onClick={() => onMarkAttendance(reg.id, 'Absent')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition duration-150 border ${
                        currentStatus === 'Absent'
                          ? 'bg-red-600 text-white border-red-600 shadow-xs'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-red-50 hover:text-red-700 hover:border-red-200'
                      }`}
                    >
                      Absent
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceTable;
