import { useMemo, useState } from 'react';
import { exportNodeToPng } from '../utils/exportImage';
import { buildVCardBlob } from '../utils/vcard';

export default function ShareMenu({ user, contactInfo, portfolioUrl, cardRef, showToast }) {
  const [open, setOpen] = useState(false);

  const contacts = useMemo(() => ({
    email: contactInfo?.emailVisible ? user?.email : null,
    phone: contactInfo?.phoneVisible ? contactInfo?.phone : null,
    linkedin: contactInfo?.linkedinVisible ? contactInfo?.linkedinUrl : null,
    github: contactInfo?.githubVisible && user?.githubUsername ? `https://github.com/${user.githubUsername}` : null,
  }), [contactInfo, user]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(portfolioUrl);
      showToast?.('Link copied to clipboard', 'success');
    } catch {
      showToast?.('Failed to copy link', 'error');
    }
  };

  const webShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: user?.name || 'My card', text: 'Check my portfolio', url: portfolioUrl });
      } catch { /* user cancelled */ }
    } else {
      await copyLink();
    }
  };

  const downloadVCard = async () => {
    try {
      const blob = buildVCardBlob({ user, contacts });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'contact.vcf';
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (e) {
      showToast?.('Failed to create vCard', 'error');
    }
  };

  const downloadNFC = async () => {
    try {
      const text = `NFC Payload\nURL: ${portfolioUrl}\n\nWrite this text to an NFC tag using any NFC writer app. When tapped, it will open the portfolio link.`;
      const blob = new Blob([text], { type: 'text/plain' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'nfc-payload.txt';
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      showToast?.('Failed to create NFC payload', 'error');
    }
  };

  const exportPNG = async () => {
    try {
      if (!cardRef?.current) throw new Error('No card node');
      await exportNodeToPng(cardRef.current, 'wcard.png');
    } catch (e) {
      showToast?.('Export failed', 'error');
    }
  };

  return (
    <div className="relative">
      <button type="button" className="btn-primary" onClick={() => setOpen(v => !v)} aria-haspopup="menu" aria-expanded={open} aria-label="Open share menu">
        Share
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10" role="menu">
          <button className="block w-full text-left px-3 py-2 hover:bg-gray-50" onClick={copyLink} role="menuitem">Copy Link</button>
          <button className="block w-full text-left px-3 py-2 hover:bg-gray-50" onClick={webShare} role="menuitem">Web Share</button>
          <div className="border-t my-1" />
          <button className="block w-full text-left px-3 py-2 hover:bg-gray-50" onClick={downloadVCard} role="menuitem">Download vCard (.vcf)</button>
          <button className="block w-full text-left px-3 py-2 hover:bg-gray-50" onClick={downloadNFC} role="menuitem">Download NFC payload (.txt)</button>
          <div className="border-t my-1" />
          <button className="block w-full text-left px-3 py-2 hover:bg-gray-50" onClick={exportPNG} role="menuitem">Export PNG</button>
        </div>
      )}
    </div>
  );
}
