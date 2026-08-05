import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Loader from '../components/Loader';
import { Settings as SettingsIcon, Save, Mail, Landmark, Image, ShieldAlert, BadgeInfo } from 'lucide-react';

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Settings values
  const [collegeName, setCollegeName] = useState('');
  const [collegeLogo, setCollegeLogo] = useState('');
  const [appName, setAppName] = useState('');
  const [theme, setTheme] = useState('light');
  const [maintenanceMode, setMaintenanceMode] = useState('false');
  const [defaultEventCapacity, setDefaultEventCapacity] = useState('100');
  
  // SMTP settings
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpSecure, setSmtpSecure] = useState('false');
  const [testingEmail, setTestingEmail] = useState(false);

  // Advanced Rules
  const [maxRegs, setMaxRegs] = useState('5');
  const [certTitle, setCertTitle] = useState('');
  const [certBody, setCertBody] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/admin/settings');
        setCollegeName(data.collegeName || '');
        setCollegeLogo(data.collegeLogo || '');
        setAppName(data.appName || '');
        setTheme(data.theme || 'light');
        setMaintenanceMode(data.maintenanceMode || 'false');
        setDefaultEventCapacity(data.defaultEventCapacity || '100');
        
        setSmtpHost(data.smtpHost || '');
        setSmtpPort(data.smtpPort || '');
        setSmtpUser(data.smtpUser || '');
        setSmtpPass(data.smtpPass || '');
        setSmtpSecure(data.smtpSecure || 'false');

        // Rules & templates
        let rulesObj = {};
        try {
          rulesObj = JSON.parse(data.registrationRules || '{}');
        } catch (e) {
          rulesObj = {};
        }
        setMaxRegs(rulesObj.maxRegistrationsPerStudent || '5');

        let certObj = {};
        try {
          certObj = JSON.parse(data.certificateTemplate || '{}');
        } catch (e) {
          certObj = {};
        }
        setCertTitle(certObj.title || 'Certificate of Participation');
        setCertBody(certObj.body || 'This is to certify that {{name}} has successfully participated...');
      } catch (err) {
        console.error(err);
        setError('Failed to load system settings.');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    setSaving(true);

    try {
      const registrationRules = JSON.stringify({
        maxRegistrationsPerStudent: parseInt(maxRegs) || 5,
      });

      const certificateTemplate = JSON.stringify({
        title: certTitle,
        body: certBody,
      });

      await api.put('/admin/settings', {
        collegeName,
        collegeLogo,
        appName,
        theme,
        maintenanceMode,
        defaultEventCapacity,
        smtpHost,
        smtpPort,
        smtpUser,
        smtpPass,
        smtpSecure,
        registrationRules,
        certificateTemplate,
      });

      setSuccess('System configuration settings saved successfully.');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to update system settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    setTestingEmail(true);
    setSuccess('');
    setError('');
    try {
      const emailToTest = prompt('Enter recipient email address to send test notification:', smtpUser);
      if (!emailToTest) {
        setTestingEmail(false);
        return;
      }
      const { data } = await api.get(`/test-email?to=${encodeURIComponent(emailToTest)}`);
      if (data.success) {
        setSuccess(`Test email sent successfully to ${emailToTest}. Please verify your mailbox.`);
      } else {
        setError('Email sending failed. Please check SMTP host/port details.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Test email delivery failed.');
    } finally {
      setTestingEmail(false);
    }
  };

  return (
    <div className="flex-grow bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <SettingsIcon className="h-8 w-8 text-primary-600" />
            Global System Configurations
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage institutional branding, SMTP relays, registration limits, certificate designs, and server maintenance.</p>
        </div>

        {/* Success/Error Alerts */}
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
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Box 1: Branding & Settings */}
              <div className="bg-white p-6 rounded-2xl border border-gray-250 shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-gray-150 text-primary-600">
                  <Landmark className="h-5 w-5" />
                  <h3 className="text-base font-bold text-gray-950">Branding & General Settings</h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">College Name</label>
                    <input
                      type="text"
                      required
                      value={collegeName}
                      onChange={(e) => setCollegeName(e.target.value)}
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">College Logo (Image URL)</label>
                    <input
                      type="text"
                      value={collegeLogo}
                      onChange={(e) => setCollegeLogo(e.target.value)}
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Application Name</label>
                    <input
                      type="text"
                      required
                      value={appName}
                      onChange={(e) => setAppName(e.target.value)}
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Default Capacity</label>
                      <input
                        type="number"
                        required
                        value={defaultEventCapacity}
                        onChange={(e) => setDefaultEventCapacity(e.target.value)}
                        className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Portal Theme</label>
                      <select
                        value={theme}
                        onChange={(e) => setTheme(e.target.value)}
                        className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm"
                      >
                        <option value="light">Classic Light</option>
                        <option value="dark">Professional Dark</option>
                        <option value="glassmorphism">Glassmorphism UI</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Box 2: SMTP Mail Settings */}
              <div className="bg-white p-6 rounded-2xl border border-gray-250 shadow-xs space-y-4">
                <div className="flex justify-between items-center pb-2.5 border-b border-gray-150 text-primary-600">
                  <div className="flex items-center gap-2.5">
                    <Mail className="h-5 w-5" />
                    <h3 className="text-base font-bold text-gray-950">SMTP Relay Settings</h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleTestEmail}
                    disabled={testingEmail}
                    className="text-xs text-primary-650 hover:text-primary-850 font-bold bg-primary-50 px-2.5 py-1.5 rounded-xl border border-primary-200 transition"
                  >
                    {testingEmail ? 'Sending...' : 'Test Connection'}
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">SMTP Host</label>
                      <input
                        type="text"
                        value={smtpHost}
                        onChange={(e) => setSmtpHost(e.target.value)}
                        placeholder="smtp.mailtrap.io"
                        className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">SMTP Port</label>
                      <input
                        type="number"
                        value={smtpPort}
                        onChange={(e) => setSmtpPort(e.target.value)}
                        placeholder="587"
                        className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">SMTP Username</label>
                    <input
                      type="text"
                      value={smtpUser}
                      onChange={(e) => setSmtpUser(e.target.value)}
                      placeholder="e.g. sender@gmail.com"
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">SMTP Password</label>
                    <input
                      type="password"
                      value={smtpPass}
                      onChange={(e) => setSmtpPass(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={smtpSecure === 'true'}
                      onChange={(e) => setSmtpSecure(e.target.checked ? 'true' : 'false')}
                      className="rounded border-gray-300 text-primary-600"
                    />
                    <span>Use Secure SSL Connection (Port 465)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Box 3: Advanced Policies & Verification Layouts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Maintenance Control */}
              <div className="bg-white p-6 rounded-2xl border border-gray-250 shadow-xs space-y-4 md:col-span-1">
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-gray-150 text-red-600">
                  <ShieldAlert className="h-5 w-5" />
                  <h3 className="text-base font-bold text-gray-950">Security Access</h3>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase">System Maintenance Mode</label>
                    <p className="text-[11px] text-gray-400 font-semibold leading-relaxed">
                      Enabling blocks standard student accounts registrations, dashboard check-ins, and file downloads. Only administrators can login and view panels.
                    </p>
                    <select
                      value={maintenanceMode}
                      onChange={(e) => setMaintenanceMode(e.target.value)}
                      className={`w-full px-3.5 py-2.5 border rounded-xl text-sm font-bold ${
                        maintenanceMode === 'true'
                          ? 'border-red-300 bg-red-50 text-red-750'
                          : 'border-gray-300 bg-white text-gray-900'
                      }`}
                    >
                      <option value="false">Inactive (System Live)</option>
                      <option value="true">Active (System Locked)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Max Registrations/Student</label>
                    <input
                      type="number"
                      required
                      value={maxRegs}
                      onChange={(e) => setMaxRegs(e.target.value)}
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Certificate Template designer */}
              <div className="bg-white p-6 rounded-2xl border border-gray-250 shadow-xs space-y-4 md:col-span-2">
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-gray-150 text-primary-600">
                  <BadgeInfo className="h-5 w-5" />
                  <h3 className="text-base font-bold text-gray-950">Participation Certificate Layout</h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Certificate Header Title</label>
                    <input
                      type="text"
                      required
                      value={certTitle}
                      onChange={(e) => setCertTitle(e.target.value)}
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Certificate Template Body</label>
                    <p className="text-[10px] text-gray-400 font-bold mb-1.5 uppercase">Dynamic replacement variables: {"{{name}}, {{department}}, {{event}}, {{college}}, {{date}}"}</p>
                    <textarea
                      rows={4}
                      required
                      value={certBody}
                      onChange={(e) => setCertBody(e.target.value)}
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm font-semibold"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 px-6 rounded-xl text-sm shadow-sm transition"
              >
                {saving ? <Loader size="small" /> : <Save className="h-4.5 w-4.5" />}
                <span>Save Configuration Changes</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default Settings;
