import { useMemo, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import ShareMenu from './ShareMenu';
import QRCodeModal from './QRCodeModal';
import QRCode from 'react-qr-code';

function getInitials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  const [a, b] = parts;
  return (a?.[0] || '') + (b?.[0] || '');
}

export default function WCard({ user, contactInfo, portfolioUrl, showToast, compact = false, showControls = true, stats, showDisclaimer = false }) {
  const cardRef = useRef(null);
  const qrRef = useRef(null);
  const [openQR, setOpenQR] = useState(false);

  const visibleContacts = useMemo(() => {
    const ghUsername = user?.githubUsername || contactInfo?.githubUsername;
    const emailValue = contactInfo?.email || user?.email;
    return {
      email: contactInfo?.emailVisible && emailValue ? emailValue : null,
      phone: contactInfo?.phoneVisible && contactInfo?.phone ? contactInfo.phone : null,
      linkedin: contactInfo?.linkedinVisible && contactInfo?.linkedinUrl ? contactInfo.linkedinUrl : null,
      github: contactInfo?.githubVisible && ghUsername ? `https://github.com/${ghUsername}` : null,
    };
  }, [contactInfo, user]);

  return (
    <div className={`bg-white ${compact ? 'rounded-lg shadow border p-4 max-w-xs' : 'rounded-xl shadow-sm border p-4 sm:p-5'} border-gray-200`} aria-label="wcard-container">
      {showControls && (
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0 mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Shareable Card</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn-secondary text-xs sm:text-sm px-3 sm:px-4 py-2"
              onClick={() => setOpenQR(true)}
              aria-label="Open QR code"
            >
              QR
            </button>
            <ShareMenu
              user={user}
              contactInfo={contactInfo}
              portfolioUrl={portfolioUrl}
              cardRef={cardRef}
              showToast={showToast}
            />
          </div>
        </div>
      )}

      {/* Card Preview area to export */}
      <div ref={cardRef} id="wcard-preview" className={`rounded-lg border ${compact ? 'p-3' : 'p-4 sm:p-5'}`}> 
        <div className={`grid grid-cols-1 lg:grid-cols-3 ${compact ? 'gap-3' : 'gap-4 sm:gap-6'}`}>
          {/* Left: Avatar + Name + Title + Contact lines */}
          <div className="lg:col-span-1">
            <div className={`flex items-center gap-3 ${compact ? 'mb-1' : 'mb-3 sm:mb-2'}`}>
              <div className={`${compact ? 'h-10 w-10 text-base' : 'h-10 w-10 sm:h-12 sm:w-12 text-base sm:text-lg'} rounded-full bg-primary-600 text-white flex items-center justify-center font-bold flex-shrink-0`} aria-hidden>
                {getInitials(user?.name)}
              </div>
              <div className="min-w-0">
                <div className={`${compact ? 'text-sm' : 'text-sm sm:text-base'} font-semibold text-gray-900 truncate`}>{user?.name || 'Your Name'}</div>
                <div className="text-xs text-gray-600 truncate">{(user?.role || 'STUDENT')}{user?.institute ? ` • ${user.institute}` : ''}</div>
              </div>
            </div>
            {!compact && user?.bio && (
              <p className="text-sm text-gray-700 mb-3 line-clamp-3">{user.bio}</p>
            )}
            <div className={`${compact ? 'space-y-0.5 text-xs' : 'space-y-1.5 sm:space-y-1 text-xs sm:text-sm'} text-gray-700`} aria-label="contact-lines">
              {visibleContacts.email && (
                <div className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path d="M2.94 6.34A2 2 0 014.62 5h10.76a2 2 0 011.68 1.34L10 10.88 2.94 6.34z"/><path d="M18 8.12l-8 4.76-8-4.76V14a2 2 0 002 2h12a2 2 0 002-2V8.12z"/></svg>
                  <a href={`mailto:${visibleContacts.email}`} className="hover:text-primary-600 truncate min-w-0">{visibleContacts.email}</a>
                </div>
              )}
              {visibleContacts.phone && (
                <div className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.95.69l1.5 4.49a1 1 0 01-.5 1.21l-2.26 1.13a11.04 11.04 0 005.52 5.52l1.13-2.26a1 1 0 011.21-.5l4.49 1.5a1 1 0 01.69.95V19a2 2 0 01-2 2h-1C9.72 21 3 14.28 3 6V5z"/></svg>
                  <a href={`tel:${visibleContacts.phone}`} className="hover:text-primary-600">{visibleContacts.phone}</a>
                </div>
              )}
              {visibleContacts.linkedin && (
                <div className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8.5h4V23h-4V8.5zm7 0h3.8v2h.1c.5-1 1.7-2.2 3.6-2.2 3.8 0 4.5 2.5 4.5 5.8V23h-4v-6.4c0-1.5 0-3.5-2.1-3.5s-2.4 1.6-2.4 3.4V23h-4V8.5z"/></svg>
                  <a href={visibleContacts.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-primary-600 truncate">LinkedIn</a>
                </div>
              )}
              {visibleContacts.github && (
                <div className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.73.5.92 5.31.92 11.58c0 4.86 3.15 8.98 7.52 10.43.55.1.75-.24.75-.53 0-.26-.01-.95-.01-1.86-3.06.67-3.71-1.31-3.71-1.31-.5-1.29-1.22-1.63-1.22-1.63-.99-.68.08-.66.08-.66 1.1.08 1.68 1.12 1.68 1.12.97 1.66 2.55 1.18 3.18.9.1-.7.38-1.18.68-1.45-2.44-.28-5-1.22-5-5.44 0-1.2.42-2.19 1.11-2.96-.11-.28-.48-1.4.11-2.92 0 0 .91-.29 2.98 1.14.86-.24 1.77-.36 2.68-.36.91 0 1.82.12 2.68.36 2.07-1.43 2.98-1.14 2.98-1.14.59 1.52.22 2.64.11 2.92.69.77 1.11 1.76 1.11 2.96 0 4.23-2.56 5.15-5 5.43.39.33.73.98.73 1.98 0 1.43-.01 2.59-.01 2.95 0 .29.2.64.76.53 4.36-1.45 7.51-5.57 7.51-10.43C23.08 5.31 18.27.5 12 .5z"/></svg>
                  <a href={visibleContacts.github} target="_blank" rel="noopener noreferrer" className="hover:text-primary-600 truncate">GitHub</a>
                </div>
              )}
            </div>
            {!compact && showDisclaimer && (
              <p className="mt-4 text-xs text-gray-500">
                This card is intended for the named recipient(s) and may contain confidential information.
              </p>
            )}
          </div>

          {/* Middle: Stats */}
          <div className="lg:col-span-1 flex items-center justify-center my-4 lg:my-0">
            {stats ? (
              <div className="w-full">
                <div className="grid grid-cols-3 lg:grid-cols-1 gap-4 lg:gap-3 text-center">
                  {typeof stats.verifiedEducation === 'number' && stats.verifiedEducation > 0 && (
                    <div>
                      <div className="text-lg sm:text-xl font-bold text-blue-600">{stats.verifiedEducation}</div>
                      <div className="text-xs text-gray-600">Education</div>
                    </div>
                  )}
                  {typeof stats.publicProjects === 'number' && stats.publicProjects > 0 && (
                    <div>
                      <div className="text-lg sm:text-xl font-bold text-purple-600">{stats.publicProjects}</div>
                      <div className="text-xs text-gray-600">Projects</div>
                    </div>
                  )}
                  {typeof stats.verifiedExperiences === 'number' && stats.verifiedExperiences > 0 && (
                    <div>
                      <div className="text-lg sm:text-xl font-bold text-green-600">{stats.verifiedExperiences}</div>
                      <div className="text-xs text-gray-600">Experiences</div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          {/* Right: QR + optional logo */}
          <div className="lg:col-span-1 flex flex-col items-center lg:items-end justify-between">
            <div className="flex flex-col items-center lg:items-end">
              {!compact && <div className="text-xs text-gray-500 mb-1 text-center lg:text-right">Connect with me</div>}
              <div className="bg-white p-1.5 sm:p-2 rounded border" ref={qrRef}>
                <QRCode value={portfolioUrl || ''} size={compact ? 72 : 80} />
              </div>
              <button
                type="button"
                className="mt-2 text-xs text-primary-600 hover:text-primary-700 font-medium"
                onClick={async () => {
                  try {
                    if (!qrRef.current) return;
                    const dataUrl = await toPng(qrRef.current);
                    const link = document.createElement('a');
                    link.download = 'trueportme-qr.png';
                    link.href = dataUrl;
                    link.click();
                  } catch (e) {
                    console.error('Failed to download QR:', e);
                    showToast?.('Failed to download QR', 'error');
                  }
                }}
                aria-label="Download QR code"
              >
                Download QR
              </button>
            </div>
            {!compact && user?.instituteLogoUrl && (
              <img src={user.instituteLogoUrl} alt="Institute Logo" className="mt-4 h-6 object-contain" />
            )}
          </div>
        </div>
      </div>

      {showControls && (
        <div className="mt-4">
          <div className="text-xs text-gray-500 mb-1">Portfolio URL</div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-1">
            <input type="text" readOnly value={portfolioUrl} className="form-input flex-1 text-xs sm:text-sm" aria-label="Portfolio URL" />
            <button
              type="button"
              className="btn-secondary text-xs sm:text-sm px-4 py-2 whitespace-nowrap"
              onClick={() => {
                navigator.clipboard.writeText(portfolioUrl);
                showToast?.('Link copied', 'success');
              }}
              aria-label="Copy portfolio link"
            >
              Copy Link
            </button>
          </div>
        </div>
      )}

      {showControls && <QRCodeModal isOpen={openQR} onClose={() => setOpenQR(false)} url={portfolioUrl} />}
    </div>
  );
}
