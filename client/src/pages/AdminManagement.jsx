import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Loader from '../components/Loader';
import { Users, Plus, Shield, ShieldCheck, Mail, Lock, Building, Trash2, Power, Eye, EyeOff } from 'lucide-react';

const AdminManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Form states
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Admin');
  const [department, setDepartment] = useState('');
  const [permissions, setPermissions] = useState([]);

  // Filters and pagination
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const availablePermissions = [
    'Events', 'Certificates', 'Attendance', 'Gallery', 'Notifications',
    'Reports', 'Students', 'Volunteers', 'Settings', 'Audit Logs',
    'Analytics', 'Admins'
  ];

  const roles = ['Super Admin', 'Admin', 'Coordinator', 'Volunteer Coordinator'];
  const departments = [
    'Computer Science and Artificial Intelligence (CAI)',
    'Artificial Intelligence and Machine Learning (AIML)',
    'Information Technology (IT)',
    'Computer Science and Technology (CST)'
  ];

  const fetchAdmins = async (currentPage = 1) => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        search,
        role: roleFilter,
        department: deptFilter,
      });

      const { data } = await api.get(`/admin/admins?${params.toString()}`);
      setAdmins(data.admins);
      setTotalPages(data.totalPages);
      setPage(data.currentPage);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to fetch administrators.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins(1);
  }, [roleFilter, deptFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAdmins(1);
  };

  const handleOpenAdd = () => {
    setUsername('');
    setEmail('');
    setPassword('');
    setRole('Admin');
    setDepartment('');
    setPermissions([]);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (admin) => {
    setSelectedAdmin(admin);
    setUsername(admin.username);
    setEmail(admin.email);
    setRole(admin.role);
    setDepartment(admin.department || '');
    let parsedPerms = [];
    try {
      parsedPerms = typeof admin.permissions === 'string' ? JSON.parse(admin.permissions) : (admin.permissions || []);
    } catch (e) {
      parsedPerms = [];
    }
    setPermissions(parsedPerms);
    setIsEditModalOpen(true);
  };

  const handleOpenPasswordReset = (admin) => {
    setSelectedAdmin(admin);
    setPassword('');
    setIsPasswordModalOpen(true);
  };

  const handlePermissionToggle = (perm) => {
    if (permissions.includes(perm)) {
      setPermissions(permissions.filter((p) => p !== perm));
    } else {
      setPermissions([...permissions, perm]);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    try {
      await api.post('/admin/admins', {
        username,
        email,
        password,
        role,
        department: department || null,
        permissions,
      });
      setSuccess('Administrator created successfully.');
      setIsAddModalOpen(false);
      fetchAdmins(page);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create administrator.');
    }
  };

  const handleUpdateAdmin = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    try {
      await api.put(`/admin/admins/${selectedAdmin.id}`, {
        username,
        email,
        role,
        department: department || null,
        permissions,
      });
      setSuccess('Administrator details updated successfully.');
      setIsEditModalOpen(false);
      fetchAdmins(page);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update administrator details.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    try {
      await api.put(`/admin/admins/${selectedAdmin.id}/reset-password`, { password });
      setSuccess(`Password for ${selectedAdmin.username} has been reset.`);
      setIsPasswordModalOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    }
  };

  const handleDeleteAdmin = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete administrator "${name}"?`)) return;
    setSuccess('');
    setError('');
    try {
      await api.delete(`/admin/admins/${id}`);
      setSuccess('Administrator account deleted.');
      fetchAdmins(page);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete administrator.');
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    setSuccess('');
    setError('');
    try {
      await api.put(`/admin/admins/${id}/toggle`, { isActive: !currentStatus });
      setSuccess('Administrator account status changed.');
      fetchAdmins(page);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to toggle status.');
    }
  };

  return (
    <div className="flex-grow bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              <Users className="h-8 w-8 text-primary-600" />
              Administrator & Role Management
            </h1>
            <p className="text-sm text-gray-500 mt-1">Manage administrative credentials, department segments, and custom access permissions.</p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm shadow-sm transition"
          >
            <Plus className="h-4 w-4" />
            <span>Create Admin User</span>
          </button>
        </div>

        {/* Success/Error Banners */}
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
              placeholder="Search by username or email..."
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
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:ring-primary-500"
            >
              <option value="">All Roles</option>
              {roles.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>

            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:ring-primary-500"
            >
              <option value="">All Departments</option>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        {/* Admins Table */}
        {loading ? (
          <div className="flex justify-center py-12"><Loader size="large" /></div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-250">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {admins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <img
                            src={admin.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'}
                            alt="Avatar"
                            className="h-9 w-9 rounded-full object-cover border border-gray-250"
                          />
                          <div>
                            <div className="text-sm font-bold text-gray-900">{admin.username}</div>
                            <div className="text-xs text-gray-500">{admin.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          admin.role === 'Super Admin' ? 'bg-red-50 text-red-700 border border-red-200' :
                          admin.role === 'Coordinator' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                          'bg-primary-50 text-primary-700 border border-primary-200'
                        }`}>
                          <Shield className="h-3 w-3" />
                          {admin.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-semibold">
                        {admin.department || 'All'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          admin.isActive ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-755 border border-red-150'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${admin.isActive ? 'bg-green-600' : 'bg-red-500'}`} />
                          {admin.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => handleToggleStatus(admin.id, admin.isActive)}
                            title={admin.isActive ? 'Deactivate' : 'Activate'}
                            className="text-gray-500 hover:text-gray-900 transition"
                          >
                            <Power className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenPasswordReset(admin)}
                            title="Reset Password"
                            className="text-purple-600 hover:text-purple-900 transition"
                          >
                            <Lock className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(admin)}
                            title="Edit Permissions"
                            className="text-primary-650 hover:text-primary-900 transition"
                          >
                            <ShieldCheck className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAdmin(admin.id, admin.username)}
                            title="Delete"
                            className="text-red-650 hover:text-red-900 transition"
                          >
                            <Trash2 className="h-4 w-4" />
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
                  onClick={() => fetchAdmins(page - 1)}
                  className="px-3.5 py-2 border border-gray-300 rounded-xl text-xs font-bold bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition"
                >
                  Previous
                </button>
                <span className="text-xs text-gray-500 font-semibold">Page {page} of {totalPages}</span>
                <button
                  disabled={page === totalPages}
                  onClick={() => fetchAdmins(page + 1)}
                  className="px-3.5 py-2 border border-gray-300 rounded-xl text-xs font-bold bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* Modal: Create Admin User */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-xl w-full border border-gray-200 shadow-2xl space-y-4">
              <h3 className="text-xl font-extrabold text-gray-900">Create Administrator</h3>
              
              <form onSubmit={handleCreateAdmin} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Username</label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Password</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm"
                    >
                      {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Department Mapping</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm"
                  >
                    <option value="">All / Global (No department restriction)</option>
                    {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                {/* Custom Permissions Select Grid */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Assign Permissions</label>
                  <div className="grid grid-cols-3 gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200">
                    {availablePermissions.map((perm) => (
                      <label key={perm} className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={permissions.includes(perm)}
                          onChange={() => handlePermissionToggle(perm)}
                          className="rounded border-gray-300 text-primary-650"
                        />
                        <span>{perm}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-bold hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-bold shadow-sm"
                  >
                    Create User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Admin Permissions */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-xl w-full border border-gray-200 shadow-2xl space-y-4">
              <h3 className="text-xl font-extrabold text-gray-900">Edit Settings for {selectedAdmin?.username}</h3>
              
              <form onSubmit={handleUpdateAdmin} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Username</label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Role</label>
                    <select
                      value={role}
                      disabled={selectedAdmin?.id === selectedAdmin?.currentUserId}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm"
                    >
                      {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Department Mapping</label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm"
                    >
                      <option value="">All / Global (No department restriction)</option>
                      {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                {/* Custom Permissions Select Grid */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Assign Permissions</label>
                  <div className="grid grid-cols-3 gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200">
                    {availablePermissions.map((perm) => (
                      <label key={perm} className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={permissions.includes(perm)}
                          onChange={() => handlePermissionToggle(perm)}
                          className="rounded border-gray-300 text-primary-650"
                        />
                        <span>{perm}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-bold hover:bg-gray-55"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-bold shadow-sm"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Reset Password */}
        {isPasswordModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-gray-200 shadow-2xl space-y-4">
              <h3 className="text-xl font-extrabold text-gray-900">Reset password for {selectedAdmin?.username}</h3>
              
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsPasswordModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-bold hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold shadow-sm"
                  >
                    Reset Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminManagement;
