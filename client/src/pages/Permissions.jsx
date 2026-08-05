import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Loader from '../components/Loader';
import { ShieldCheck, Save, RefreshCw } from 'lucide-react';

const Permissions = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [savingId, setSavingId] = useState(null);

  // Storing local working permission changes
  const [workingPerms, setWorkingPerms] = useState({});

  const availablePermissions = [
    'Events', 'Certificates', 'Attendance', 'Gallery', 'Notifications',
    'Reports', 'Students', 'Volunteers', 'Settings', 'Audit Logs',
    'Analytics', 'Admins'
  ];

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get('/admin/admins?limit=50');
      setAdmins(data.admins);

      // Pre-populate working permission states
      const permsMap = {};
      data.admins.forEach((admin) => {
        let list = [];
        try {
          list = typeof admin.permissions === 'string' ? JSON.parse(admin.permissions) : (admin.permissions || []);
        } catch (e) {
          list = [];
        }
        permsMap[admin.id] = list;
      });
      setWorkingPerms(permsMap);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to fetch administrators list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleCellToggle = (adminId, perm) => {
    const currentList = workingPerms[adminId] || [];
    let newList;
    if (currentList.includes(perm)) {
      newList = currentList.filter((p) => p !== perm);
    } else {
      newList = [...currentList, perm];
    }
    setWorkingPerms({
      ...workingPerms,
      [adminId]: newList,
    });
  };

  const handleSavePermissions = async (admin) => {
    setSuccess('');
    setError('');
    setSavingId(admin.id);
    try {
      const perms = workingPerms[admin.id] || [];
      await api.put(`/admin/admins/${admin.id}`, {
        username: admin.username,
        email: admin.email,
        role: admin.role,
        department: admin.department,
        permissions: perms,
      });
      setSuccess(`Updated permissions for ${admin.username} successfully.`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save permissions.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="flex-grow bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              <ShieldCheck className="h-8 w-8 text-primary-600" />
              Administrative Permissions Matrix
            </h1>
            <p className="text-sm text-gray-500 mt-1">Directly view and toggle fine-grained feature clearances across all administrative accounts.</p>
          </div>
          <button
            onClick={fetchAdmins}
            className="flex items-center gap-1.5 border border-gray-300 hover:bg-gray-100 text-gray-700 bg-white font-bold py-2 px-3.5 rounded-xl text-xs transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Reload Matrix</span>
          </button>
        </div>

        {/* Success/Error banners */}
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

        {loading ? (
          <div className="flex justify-center py-12"><Loader size="large" /></div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-250">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 shadow-sm border-r border-gray-200">Administrator</th>
                    {availablePermissions.map((perm) => (
                      <th key={perm} className="px-4 py-4 text-center text-xs font-black text-gray-500 uppercase tracking-wider">
                        {perm}
                      </th>
                    ))}
                    <th className="px-6 py-4 text-right text-xs font-black text-gray-500 uppercase tracking-wider">Save</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {admins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-white z-10 shadow-sm border-r border-gray-200">
                        <div>
                          <div className="text-sm font-bold text-gray-900">{admin.username}</div>
                          <div className="text-[10px] text-gray-500 font-semibold uppercase">{admin.role} {admin.department ? `(${admin.department})` : ''}</div>
                        </div>
                      </td>

                      {availablePermissions.map((perm) => {
                        const isSuperAdmin = admin.role === 'Super Admin';
                        const isChecked = isSuperAdmin || (workingPerms[admin.id] || []).includes(perm);
                        return (
                          <td key={perm} className="px-4 py-4 text-center whitespace-nowrap">
                            <input
                              type="checkbox"
                              disabled={isSuperAdmin}
                              checked={isChecked}
                              onChange={() => handleCellToggle(admin.id, perm)}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-4.5 w-4.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                            />
                          </td>
                        );
                      })}

                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleSavePermissions(admin)}
                          disabled={savingId === admin.id || admin.role === 'Super Admin'}
                          className="inline-flex items-center gap-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-1.5 px-3.5 rounded-lg text-xs shadow-xs transition disabled:opacity-50"
                        >
                          <Save className="h-3.5 w-3.5" />
                          <span>{savingId === admin.id ? 'Saving...' : 'Save'}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Permissions;
