import { useEffect, useRef } from 'react';
import QRCode from 'react-qr-code';
import { toPng } from 'html-to-image';

export default function QRCodeModal({ isOpen, onClose, url }) {
  const svgWrapRef = useRef(null);

  useEffect(() => {
    function onEsc(e) { if (e.key === 'Escape') onClose?.(); }
    if (isOpen) window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const downloadSvg = () => {
    const svg = svgWrapRef.current?.querySelector('svg');
    if (!svg) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'trueportme-qr.svg';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const downloadPng = async () => {
    const node = svgWrapRef.current;
    if (!node) return;
    const dataUrl = await toPng(node);
    const link = document.createElement('a');
    link.download = 'trueportme-qr.png';
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" role="dialog" aria-modal="true">
      <div className="bg-white w-full max-w-sm rounded-lg shadow-lg p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Your QR Code</h3>
          <button className="text-gray-500 hover:text-gray-700" onClick={onClose} aria-label="Close QR modal">✕</button>
        </div>
        <div ref={svgWrapRef} className="bg-white p-4 rounded flex items-center justify-center">
          <QRCode value={url || ''} size={192} />
        </div>
        <div className="mt-4 flex items-center justify-between">
          <button className="btn-secondary" onClick={downloadSvg}>Download SVG</button>
          <button className="btn-primary" onClick={downloadPng}>Download PNG</button>
        </div>
      </div>
    </div>
  );
}
