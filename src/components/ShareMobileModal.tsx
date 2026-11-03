import React, { useState } from 'react';
import { X, Copy, Check, QrCode, Smartphone, Globe, ExternalLink, Sparkles } from 'lucide-react';

interface ShareMobileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareMobileModal: React.FC<ShareMobileModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://ais-pre-6r3hrvm6drtg3rbntiafus-974395331959.europe-west2.run.app';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(currentUrl)}&bgcolor=111421&color=38BDF8&margin=10`;

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[#111421] border border-[#272B3A] rounded-2xl shadow-2xl p-6 sm:p-8 text-[#F8FAFC]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-[#858B9B] hover:text-[#F8FAFC] hover:bg-[#191D2B] rounded-lg transition-colors cursor-pointer"
          aria-label="Close share dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 flex items-center justify-center text-[#38BDF8]">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Mobile Access & Web Link
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#8B5CF6]/20 text-[#38BDF8] border border-[#8B5CF6]/40">
                PWA Ready
              </span>
            </h2>
            <p className="text-xs text-[#858B9B]">
              Open ASTREON on your mobile phone or share with your team
            </p>
          </div>
        </div>

        {/* Scan QR Code Section */}
        <div className="bg-[#080A12] border border-[#272B3A] rounded-xl p-5 mb-6 flex flex-col sm:flex-row items-center gap-6">
          <div className="shrink-0 p-2.5 bg-[#111421] border border-[#272B3A] rounded-xl shadow-inner flex flex-col items-center">
            <img
              src={qrCodeUrl}
              alt="Scan QR code to open ASTREON on mobile"
              width={160}
              height={160}
              className="rounded-lg"
              loading="lazy"
            />
            <span className="text-[10px] text-[#858B9B] font-mono mt-2 flex items-center gap-1">
              <QrCode className="w-3 h-3 text-[#38BDF8]" /> Point phone camera
            </span>
          </div>

          <div className="space-y-3 text-center sm:text-left">
            <h3 className="text-sm font-semibold text-[#F8FAFC] flex items-center justify-center sm:justify-start gap-1.5">
              <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
              Instant Mobile Scan (No Typing Needed!)
            </h3>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              Open the <strong>Camera</strong> app on your iPhone or Android phone, point it at this QR code, and tap the notification link to open ASTREON immediately.
            </p>

            <div className="pt-1">
              <div className="text-[11px] font-mono text-[#38BDF8] bg-[#111421] px-3 py-1.5 rounded-md border border-[#272B3A] inline-block">
                Tip: Tap "Add to Home Screen" to install it as an App
              </div>
            </div>
          </div>
        </div>

        {/* Current URL & Copy button */}
        <div className="mb-6 space-y-2">
          <label className="text-xs font-medium text-[#A1A1AA] flex items-center justify-between">
            <span>Direct App Address:</span>
            <span className="text-[11px] text-[#858B9B]">Google Cloud Run Deployment</span>
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-3 py-2 text-xs font-mono bg-[#080A12] border border-[#272B3A] rounded-lg text-[#F8FAFC] overflow-x-auto whitespace-nowrap selection:bg-[#8B5CF6]/40">
              {currentUrl}
            </div>
            <button
              onClick={handleCopy}
              className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                copied
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-[#8B5CF6] hover:bg-[#7C3AED] text-white shadow-sm shadow-[#8B5CF6]/30'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Domain & URL renaming guidance */}
        <div className="space-y-4 pt-4 border-t border-[#272B3A] text-xs">
          <h4 className="font-semibold text-[#F8FAFC] flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-[#38BDF8]" />
            About Renaming the URL
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-[#080A12] border border-[#272B3A] rounded-xl space-y-1.5">
              <span className="font-semibold text-white block">1. Why the link is long:</span>
              <p className="text-[#A1A1AA] text-[11px] leading-relaxed">
                The <code className="text-[#38BDF8] font-mono">ais-pre-...run.app</code> address is an automated Google Cloud infrastructure address generated automatically for your secure Cloud Run container. It cannot be edited from inside the code.
              </p>
            </div>

            <div className="p-3 bg-[#080A12] border border-[#272B3A] rounded-xl space-y-1.5">
              <span className="font-semibold text-white block">2. Quick Short Link (30 secs):</span>
              <p className="text-[#A1A1AA] text-[11px] leading-relaxed">
                You can create a free memorable alias like <code className="text-[#38BDF8] font-mono">tinyurl.com/astreon</code> or <code className="text-[#38BDF8] font-mono">bit.ly/astreon</code> by pasting the link into TinyURL or Bitly.
              </p>
            </div>

            <div className="p-3 bg-[#080A12] border border-[#272B3A] rounded-xl space-y-1.5">
              <span className="font-semibold text-white block">3. Add to Phone Home Screen:</span>
              <p className="text-[#A1A1AA] text-[11px] leading-relaxed">
                In Chrome (Android) tap <span className="text-white font-medium">⋮ &gt; Add to Home screen</span>. In Safari (iOS) tap <span className="text-white font-medium">Share &gt; Add to Home Screen</span>. It opens as a standalone full-screen app named <strong>ASTREON</strong>!
              </p>
            </div>

            <div className="p-3 bg-[#080A12] border border-[#272B3A] rounded-xl space-y-1.5">
              <span className="font-semibold text-white block">4. Custom Domain (Production):</span>
              <p className="text-[#A1A1AA] text-[11px] leading-relaxed">
                For a permanent domain (e.g. <code className="text-[#38BDF8] font-mono">astreon.app</code>), connect custom DNS records to Google Cloud Run or Firebase Hosting in your Google Cloud Project console.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-[#A1A1AA] hover:text-white bg-[#191D2B] hover:bg-[#272B3A] border border-[#272B3A] rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
