import React, { useState } from 'react';
import api from '../services/api';
import { Download, FileText } from 'lucide-react';

const ExportButton = ({ endpoint, filename, label = 'Export CSV', className }) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const response = await api.get(endpoint, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename || 'report.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download report:', err);
      alert('Report export failed.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className={
        className ||
        'flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-semibold px-4 py-2 rounded-xl text-xs border border-gray-300 shadow-xs transition duration-150'
      }
    >
      {downloading ? <FileText className="h-4 w-4 animate-spin text-primary-600" /> : <Download className="h-4 w-4 text-gray-500" />}
      <span>{downloading ? 'Preparing...' : label}</span>
    </button>
  );
};

export default ExportButton;
