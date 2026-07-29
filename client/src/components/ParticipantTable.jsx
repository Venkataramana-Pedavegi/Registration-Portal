import React from 'react';
import { Calendar, User, BookOpen, GraduationCap, Mail } from 'lucide-react';
import RegistrationBadge from './RegistrationBadge';

const ParticipantTable = ({ participants }) => {
  if (!participants || participants.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-250 p-8 text-gray-500">
        <p className="font-semibold text-gray-700">No participants found matching criteria.</p>
        <p className="text-sm mt-1">Try resetting search query or filter dropdown selections.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-left text-sm text-gray-900">
          <thead className="bg-gray-50 text-xs font-bold text-gray-700 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Student Details</th>
              <th className="px-6 py-4">Academic Details</th>
              <th className="px-6 py-4">Registration Info</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {participants.map((reg) => {
              const student = reg.Student;
              if (!student) return null;

              return (
                <tr key={reg.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary-50 text-primary-700 p-2 rounded-full border border-primary-100 shrink-0">
                        <User className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-950">{student.fullName}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Mail className="h-3 w-3 text-gray-450" />
                          <span>{student.email}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-750">
                    <div className="flex items-center text-xs text-gray-700 gap-1.5 mb-1">
                      <BookOpen className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span>{student.department}</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-500 gap-1.5">
                      <GraduationCap className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span>{student.year}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-650">
                    <div className="flex items-center text-xs text-gray-700 gap-1.5 mb-1">
                      <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span>{new Date(reg.registrationDate).toLocaleDateString()}</span>
                    </div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider pl-5">
                      ID: REG-{reg.id}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <RegistrationBadge status={reg.status} />
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

export default ParticipantTable;
