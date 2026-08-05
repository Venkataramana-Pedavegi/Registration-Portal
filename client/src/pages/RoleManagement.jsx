import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Loader from '../components/Loader';
import { Shield, ShieldAlert, Award, User, CheckCircle2 } from 'lucide-react';

const RoleManagement = () => {
  const [roleCounts, setRoleCounts] = useState({
    'Super Admin': 0,
    'Admin': 0,
    'Coordinator': 0,
    'Volunteer Coordinator': 0,
    'Student': 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoleData = async () => {
      try {
        setLoading(true);
        // Load count of students & admins to aggregate
        const adminRes = await api.get('/admin/admins?limit=100');
        const studentRes = await api.get('/admin/students/manage?limit=1');
        
        const counts = {
          'Super Admin': 0,
          'Admin': 0,
          'Coordinator': 0,
          'Volunteer Coordinator': 0,
          'Student': studentRes.data.totalStudents || 0,
        };

        if (adminRes.data && adminRes.data.admins) {
          adminRes.data.admins.forEach((admin) => {
            if (counts[admin.role] !== undefined) {
              counts[admin.role]++;
            } else {
              counts['Admin']++;
            }
          });
        }
        setRoleCounts(counts);
      } catch (err) {
        console.error('Failed to load role statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRoleData();
  }, []);

  const roleDefinitions = [
    {
      name: 'Super Admin',
      icon: ShieldAlert,
      color: 'bg-red-50 text-red-700 border-red-200',
      description: 'Full system administration capabilities. Can create/delete admin users, perform database backups, run restores, and toggle security/maintenance policies.',
      privileges: ['Database backup/restore', 'Admin users management', 'Announcements broadcasting', 'Access audit logs', 'Configure SMTP / settings'],
    },
    {
      name: 'Admin',
      icon: Shield,
      color: 'bg-primary-50 text-primary-700 border-primary-200',
      description: 'Standard event manager. Can create and duplicate events, manage student registrations, mark attendance, generate certificates, and review event reports.',
      privileges: ['Manage event catalog', 'Approve registrations', 'Issue certificates', 'Mark student attendance', 'View dashboard reports'],
    },
    {
      name: 'Coordinator',
      icon: Award,
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      description: 'Department-specific coordinators. Restricted to managing events, participants, and reports under their assigned department segment (e.g. CSE, ECE).',
      privileges: ['Manage department events', 'Track participant logs', 'Review department analytics', 'Mark event attendance'],
    },
    {
      name: 'Volunteer Coordinator',
      icon: Award,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      description: 'Special coordinator in charge of volunteer networks. Handles volunteer tasks assignments, marks volunteer hours, and tracks progress logs.',
      privileges: ['Approve volunteer requests', 'Assign volunteer duties', 'Log volunteer hours', 'Track volunteer analytics'],
    },
    {
      name: 'Student',
      icon: User,
      color: 'bg-green-50 text-green-700 border-green-200',
      description: 'Standard portal accounts for students. Allows event browsing, calendar tracking, qr-code check-ins, certificate downloads, and gamified achievements.',
      privileges: ['Register for events', 'Download certificates', 'Earn badges and points', 'Track profile history', 'Apply to volunteer'],
    },
  ];

  return (
    <div className="flex-grow bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary-600" />
            System Roles Overview
          </h1>
          <p className="text-sm text-gray-500 mt-1">Review the system role definitions, template clearances, and active user distributions.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader size="large" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roleDefinitions.map((roleDef) => {
              const Icon = roleDef.icon;
              return (
                <div key={roleDef.name} className="bg-white p-6 rounded-2xl border border-gray-250 shadow-xs space-y-5 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${roleDef.color}`}>
                        <Icon className="h-3.5 w-3.5" />
                        {roleDef.name}
                      </span>
                      <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                        {roleCounts[roleDef.name] || 0} user(s)
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 font-medium leading-relaxed pt-1">
                      {roleDef.description}
                    </p>

                    <div className="space-y-2 pt-2">
                      <div className="text-xs font-bold text-gray-900 uppercase tracking-wider">Key Privileges</div>
                      <div className="space-y-1.5">
                        {roleDef.privileges.map((priv) => (
                          <div key={priv} className="flex items-start gap-2 text-xs text-gray-500 font-semibold">
                            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                            <span>{priv}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};

export default RoleManagement;
