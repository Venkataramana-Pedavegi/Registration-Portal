import React, { useState } from 'react';
import api from '../services/api';
import { Award, Download, Calendar, CheckCircle } from 'lucide-react';

const CertificateCard = ({ certificate }) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const response = await api.get(`/certificates/${certificate.id || certificate._id}/download`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Certificate_${certificate.certificateId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Failed to download PDF certificate.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-250 shadow-xs flex flex-col justify-between space-y-6 transition duration-200 hover:-translate-y-0.5">
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <img
              src="/sri_vasavi_logo.png"
              alt="Sri Vasavi Engineering College"
              className="h-10 w-10 object-contain rounded-full shadow-xs border border-primary-100 bg-white p-0.5"
            />
            <div className="bg-amber-50 text-amber-600 p-2 rounded-xl border border-amber-200">
              <Award className="h-5 w-5" />
            </div>
          </div>
          <span className="bg-green-50 text-green-700 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-green-200 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> VERIFIED
          </span>
        </div>

        <div>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Official Certificate</span>
          <h3 className="text-lg font-extrabold text-gray-950">{certificate.Event?.title || 'Campus Event'}</h3>
          <p className="text-xs text-gray-500 mt-1">Organized by {certificate.Event?.organizer || 'College'}</p>
        </div>

        <div className="text-xs text-gray-600 space-y-1 bg-gray-50 p-3 rounded-xl border border-gray-200">
          <div className="flex justify-between">
            <span className="text-gray-400">Certificate ID:</span>
            <span className="font-mono font-bold text-gray-900">{certificate.certificateId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Issued On:</span>
            <span>{new Date(certificate.issueDate).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <button
        onClick={handleDownload}
        disabled={downloading}
        className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 rounded-xl text-xs transition duration-150 flex items-center justify-center gap-2 shadow-xs"
      >
        <Download className="h-4 w-4" />
        <span>{downloading ? 'Generating PDF...' : 'Download PDF Certificate'}</span>
      </button>
    </div>
  );
};

export default CertificateCard;
