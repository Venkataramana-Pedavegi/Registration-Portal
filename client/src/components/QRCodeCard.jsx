import React from 'react';
import { QrCode, Download } from 'lucide-react';

const QRCodeCard = ({ 
  registrationId, 
  qrCodeUrl, 
  eventTitle, 
  studentName, 
  rollNumber,
  eventDate,
  venue,
  status
}) => {
  const handleDownloadQR = () => {
    if (!qrCodeUrl) return;
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `QRCode_Registration_${registrationId}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-250 shadow-xs text-center space-y-5 max-w-sm mx-auto">
      <div className="flex flex-col items-center justify-center gap-1">
        <div className="flex items-center gap-2 text-primary-700 font-extrabold text-sm uppercase tracking-wider">
          <QrCode className="h-5 w-5" />
          <span>Event Entry Pass</span>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 inline-block shadow-inner">
        {qrCodeUrl ? (
          <img src={qrCodeUrl} alt="Entry QR Code" className="w-48 h-48 mx-auto rounded-lg border border-white" />
        ) : (
          <div className="w-48 h-48 flex items-center justify-center text-gray-400 text-xs font-semibold">Generating QR...</div>
        )}
      </div>

      {/* Structured Entry Pass Details */}
      <div className="border-t border-gray-100 pt-4 text-left space-y-2.5 text-xs text-gray-700">
        <div className="flex justify-between items-center pb-1 border-b border-gray-50">
          <span className="font-bold text-gray-400 uppercase text-[10px]">Pass Type</span>
          <span className="font-extrabold text-primary-700 uppercase tracking-wider">EVENT ENTRY PASS</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400 font-medium">Student Name</span>
          <span className="font-bold text-gray-950">{studentName || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400 font-medium">Roll Number</span>
          <span className="font-bold text-gray-950">{rollNumber || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400 font-medium">Event Name</span>
          <span className="font-bold text-gray-950 text-right max-w-[200px] truncate">{eventTitle || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400 font-medium">Registration ID</span>
          <span className="font-bold text-gray-950">#{registrationId}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400 font-medium">Pass ID</span>
          <span className="font-bold text-gray-950">#{registrationId}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400 font-medium">Event Date</span>
          <span className="font-bold text-gray-950">
            {eventDate ? new Date(eventDate).toLocaleDateString() : 'N/A'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400 font-medium">Venue</span>
          <span className="font-bold text-gray-950">{venue || 'N/A'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400 font-medium">Status</span>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
            status === 'Cancelled' 
              ? 'bg-red-50 text-red-705 border border-red-200' 
              : 'bg-green-50 text-green-705 border border-green-200'
          }`}>
            {status || 'Registered'}
          </span>
        </div>
      </div>

      <button
        onClick={handleDownloadQR}
        disabled={!qrCodeUrl}
        className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 rounded-xl text-xs transition duration-150 flex items-center justify-center gap-2 shadow-xs"
      >
        <Download className="h-4 w-4" />
        <span>Download Entry QR Pass</span>
      </button>
    </div>
  );
};

export default QRCodeCard;
