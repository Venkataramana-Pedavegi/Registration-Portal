import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Loader from '../components/Loader';
import { Users, Search, Power, Edit3, Eye, FileText, CheckCircle2, Award, History, X } from 'lucide-react';

const StudentManager = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filtering states
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Detail Modal & Edit Modal
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editRoll, setEditRoll] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editDept, setEditDept] = useState('');
  const [editYear, setEditYear] = useState('');

  const departments = [
    'Computer Science and Artificial Intelligence (CAI)',
    'Artificial Intelligence and Machine Learning (AIML)',
    'Information Technology (IT)',
    'Computer Science and Technology (CST)'
  ];
  const years = ['1', '2', '3', '4'];

  const fetchStudents = async (currentPage = 1) => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        search,
        department: deptFilter,
        year: yearFilter,
        isActive: activeFilter,
      });

      const { data } = await api.get(`/admin/students/manage?${params.toString()}`);
      setStudents(data.students);
      setTotalPages(data.totalPages);
      setPage(data.currentPage);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to retrieve students list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents(1);
  }, [deptFilter, yearFilter, activeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchStudents(1);
  };

  const handleToggleStatus = async (id, currentStatus) => {
    setSuccess('');
    setError('');
    try {
      await api.put(`/admin/students/${id}/toggle`, { isActive: !currentStatus });
      setSuccess('Student account status updated successfully.');
      fetchStudents(page);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to toggle student account status.');
    }
  };

  const handleOpenDetails = async (student) => {
    setSelectedStudent(student);
    setStudentDetails(null);
    setLoadingDetails(true);
    try {
      const { data } = await api.get(`/admin/students/${student.id}/details`);
      setStudentDetails(data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to retrieve student activity logs.');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleOpenEdit = (student) => {
    setSelectedStudent(student);
    setEditName(student.fullName);
    setEditRoll(student.rollNumber);
    setEditEmail(student.email);
    setEditDept(student.department);
    setEditYear(student.year);
    setIsEditOpen(true);
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    try {
      await api.put(`/admin/students/${selectedStudent.id}`, {
        fullName: editName,
        rollNumber: editRoll,
        email: editEmail,
        department: editDept,
        year: editYear,
      });
      setSuccess('Student profile updated successfully.');
      setIsEditOpen(false);
      fetchStudents(page);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to update student profile.');
    }
  };

  return (
    <div className="flex-grow bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8 text-primary-600" />
            Student Accounts Directory
          </h1>
          <p className="text-sm text-gray-500 mt-1">Search student roster, modify profiles, lock accounts, verify registration schedules, and view login histories.</p>
        </div>

        {/* Banners */}
        {success && (
          <div className="p-4 bg-green-50 text-green-800 rounded-xl border border-green-200 text-sm font-medium">
            {success}
          </div>
        )}
        {error && (
          <div className="p-4 bg-red-50 text-red-800 rounded-xl border border-red-200 text-sm font-medium">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 flex flex-col md:flex-row gap-4 items-center">
          <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex gap-2">
            <input
              type="text"
              placeholder="Search by name, roll number, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:ring-primary-500 focus:border-primary-500"
            />
            <button
              type="submit"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold border border-gray-300 transition"
            >
              Search
            </button>
          </form>

          <div className="flex gap-4 w-full md:w-auto">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:ring-primary-500"
            >
              <option value="">All Departments</option>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>

            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:ring-primary-500"
            >
              <option value="">All Years</option>
              {years.map((y) => <option key={y} value={y}>{y} Year</option>)}
            </select>

            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:ring-primary-500"
            >
              <option value="">All Statuses</option>
              <option value="true">Active Only</option>
              <option value="false">Disabled Only</option>
            </select>
          </div>
        </div>

        {/* Student Table */}
        {loading ? (
          <div className="flex justify-center py-12"><Loader size="large" /></div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-250">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Student Name</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Roll Number</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Year</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <img
                            src={student.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}
                            alt="Avatar"
                            className="h-9 w-9 rounded-full object-cover border border-gray-250"
                          />
                          <div>
                            <div className="text-sm font-bold text-gray-900">{student.fullName}</div>
                            <div className="text-xs text-gray-500">{student.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 uppercase">
                        {student.rollNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-semibold">
                        {student.department}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-semibold">
                        {student.year} Year
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          student.isActive ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-750 border border-red-150'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${student.isActive ? 'bg-green-600' : 'bg-red-500'}`} />
                          {student.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-3.5">
                          <button
                            onClick={() => handleToggleStatus(student.id, student.isActive)}
                            title={student.isActive ? 'Deactivate' : 'Activate'}
                            className="text-gray-500 hover:text-gray-900 transition"
                          >
                            <Power className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(student)}
                            title="Edit Profile"
                            className="text-primary-650 hover:text-primary-900 transition"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDetails(student)}
                            title="View Activity Logs"
                            className="text-purple-650 hover:text-purple-900 transition"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-250 flex justify-between items-center">
                <button
                  disabled={page === 1}
                  onClick={() => fetchStudents(page - 1)}
                  className="px-3.5 py-2 border border-gray-300 rounded-xl text-xs font-bold bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition"
                >
                  Previous
                </button>
                <span className="text-xs text-gray-500 font-semibold">Page {page} of {totalPages}</span>
                <button
                  disabled={page === totalPages}
                  onClick={() => fetchStudents(page + 1)}
                  className="px-3.5 py-2 border border-gray-300 rounded-xl text-xs font-bold bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* Modal: Edit Student Profile */}
        {isEditOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-xl w-full border border-gray-200 shadow-2xl space-y-4">
              <h3 className="text-xl font-extrabold text-gray-900">Edit Student Profile</h3>
              
              <form onSubmit={handleUpdateStudent} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Roll Number</label>
                    <input
                      type="text"
                      required
                      value={editRoll}
                      onChange={(e) => setEditRoll(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm uppercase font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Department</label>
                    <select
                      value={editDept}
                      onChange={(e) => setEditDept(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-primary-500"
                    >
                      {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Year of Study</label>
                    <select
                      value={editYear}
                      onChange={(e) => setEditYear(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-primary-500"
                    >
                      {years.map((y) => <option key={y} value={y}>{y} Year</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-bold hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-bold shadow-sm"
                  >
                    Update Student
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Student Activity details drawer */}
        {selectedStudent && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-65 flex justify-end">
            <div className="bg-white max-w-2xl w-full h-full flex flex-col p-6 overflow-y-auto space-y-6 shadow-2xl relative animate-in slide-in-from-right duration-250 border-l border-gray-200">
              
              <button
                onClick={() => setSelectedStudent(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition"
              >
                <X className="h-6 w-6" />
              </button>

              <div className="flex items-center gap-4">
                <img
                  src={selectedStudent.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}
                  alt="Avatar"
                  className="h-16 w-16 rounded-full object-cover border border-gray-200"
                />
                <div>
                  <h3 className="text-xl font-black text-gray-900">{selectedStudent.fullName}</h3>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{selectedStudent.rollNumber} • {selectedStudent.department} Dept • Year {selectedStudent.year}</p>
                </div>
              </div>

              {loadingDetails ? (
                <div className="flex-grow flex items-center justify-center"><Loader size="large" /></div>
              ) : studentDetails ? (
                <div className="space-y-6 flex-grow">
                  
                  {/* Event Registrations */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-primary-650" />
                      Registrations & Attendance ({studentDetails.registrations?.length || 0})
                    </h4>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl divide-y overflow-hidden max-h-40 overflow-y-auto">
                      {studentDetails.registrations?.length === 0 ? (
                        <p className="p-3.5 text-xs text-gray-400 font-bold text-center">No active registrations.</p>
                      ) : (
                        studentDetails.registrations.map((reg) => (
                          <div key={reg.id} className="p-3 text-xs flex justify-between items-center hover:bg-gray-100">
                            <div>
                              <div className="font-bold text-gray-900">{reg.Event?.title}</div>
                              <div className="text-[10px] text-gray-400 mt-0.5">{new Date(reg.Event?.eventDate).toLocaleDateString()}</div>
                            </div>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              reg.Attendance?.attendanceStatus === 'Present' ? 'bg-green-50 text-green-700 border border-green-200' :
                              reg.status === 'Cancelled' ? 'bg-red-50 text-red-700 border border-red-200' :
                              'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {reg.status === 'Cancelled' ? 'Cancelled' : (reg.Attendance?.attendanceStatus || 'Not Marked')}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Certificates issued */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Earned Participation Certificates ({studentDetails.certificates?.length || 0})
                    </h4>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl divide-y overflow-hidden max-h-32 overflow-y-auto">
                      {studentDetails.certificates?.length === 0 ? (
                        <p className="p-3.5 text-xs text-gray-400 font-bold text-center">No certificates earned yet.</p>
                      ) : (
                        studentDetails.certificates.map((cert) => (
                          <div key={cert.id} className="p-3 text-xs flex justify-between items-center">
                            <div>
                              <div className="font-bold text-gray-900">{cert.Event?.title}</div>
                              <div className="text-[10px] text-gray-400 mt-0.5">ID: {cert.certificateId}</div>
                            </div>
                            <span className="text-[10px] text-gray-400 font-bold">{new Date(cert.issueDate).toLocaleDateString()}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Badges Achievements */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="h-4 w-4 text-purple-600" />
                      Gamified Badges & Points
                    </h4>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs flex flex-wrap gap-2.5 max-h-32 overflow-y-auto">
                      {studentDetails.achievements?.length === 0 ? (
                        <p className="text-xs text-gray-400 font-bold text-center w-full py-1">No badges unlocked yet.</p>
                      ) : (
                        studentDetails.achievements.map((ach) => (
                          <span key={ach.id} className="bg-purple-50 text-purple-700 border border-purple-200 font-bold px-2 py-1 rounded-lg text-[10px] uppercase">
                            {ach.details}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Login History logs */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                      <History className="h-4 w-4 text-gray-600" />
                      Portal Sign-In Logs (Last 15)
                    </h4>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl divide-y overflow-hidden max-h-40 overflow-y-auto">
                      {studentDetails.loginHistory?.length === 0 ? (
                        <p className="p-3.5 text-xs text-gray-400 font-bold text-center">No sign-in history logged.</p>
                      ) : (
                        studentDetails.loginHistory.map((log) => (
                          <div key={log.id} className="p-3 text-[10px] flex justify-between items-center text-gray-500 font-semibold">
                            <div>
                              <div>IP: <span className="font-mono text-gray-700">{log.ipAddress}</span></div>
                              <div className="mt-0.5 text-[9px] uppercase">{log.device} • {log.browser}</div>
                            </div>
                            <span className="font-bold text-gray-400">{new Date(log.createdAt).toLocaleString()}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>
              ) : null}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default StudentManager;
