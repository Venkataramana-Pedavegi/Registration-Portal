import React from 'react';
import { QrCode, Download, CheckCircle2 } from 'lucide-react';

const QRCodeCard = ({ registrationId, qrCodeUrl, eventTitle, studentName, rollNumber }) => {
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
      <div className="flex items-center justify-center gap-2 text-primary-700 font-bold text-sm">
        <QrCode className="h-5 w-5" />
        <span>Official Event Entry Pass</span>
      </div>

      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 inline-block shadow-inner">
        {qrCodeUrl ? (
          <img src={qrCodeUrl} alt="Entry QR Code" className="w-48 h-48 mx-auto rounded-lg border border-white" />
        ) : (
          <div className="w-48 h-48 flex items-center justify-center text-gray-400 text-xs font-semibold">Generating QR...</div>
        )}
      </div>

      <div className="space-y-1 text-xs">
        <div className="font-extrabold text-gray-950 text-base">{eventTitle || 'Campus Event'}</div>
        <div className="text-gray-600 font-medium">{studentName} ({rollNumber})</div>
        <div className="text-gray-400">Pass ID: #{registrationId}</div>
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
