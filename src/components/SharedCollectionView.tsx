import React, { useState } from 'react';
import { CustomCollection } from '../types/entertainment';
import { buildCollectionShareUrl } from '../utils/collections';
import { formatRating, formatReleaseYear } from '../utils/entertainment';
import { useI18n } from '../contexts/I18nContext';
import { Share2, Check, Film, Tv, ArrowLeft, Globe, Lock } from 'lucide-react';

interface SharedCollectionViewProps {
  collection: CustomCollection | null;
  loading?: boolean;
  onSelectMediaById: (mediaId: number, mediaType: 'movie' | 'tv') => void;
  onBackHome: () => void;
}

export const SharedCollectionView: React.FC<SharedCollectionViewProps> = ({
  collection,
  loading = false,
  onSelectMediaById,
  onBackHome
}) => {
  const { t, tGenre, formatDate } = useI18n();
  const [copied, setCopied] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="h-32 rounded-2xl bg-[#111421] border border-[#272B3A] animate-pulse" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <p className="text-sm font-medium text-[#F8FAFC]">{t('account.listNotFound')}</p>
        <button
          type="button"
          onClick={onBackHome}
          className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-semibold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('account.listBackHome')}</span>
        </button>
      </div>
    );
  }

  const handleCopyShare = async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = buildCollectionShareUrl(origin, collection.id);
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch {}
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" data-testid="shared-collection-view">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#111421] border border-[#272B3A]">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-mono text-[#38BDF8]">
            {collection.isPublic ? (
              <Globe className="w-3.5 h-3.5" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-[#858B9B]" />
            )}
            <span>{collection.isPublic ? t('account.collectionPublic') : t('account.collectionPrivate')}</span>
            <span>·</span>
            <span className="text-[#858B9B]">{collection.ownerName}</span>
            <span>·</span>
            <span className="text-[#858B9B] tabular-nums">{formatDate(collection.updatedAt)}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#F8FAFC] tracking-tight">
            {collection.name}
          </h1>
          {collection.description && (
            <p className="text-xs sm:text-sm text-[#A1A1AA] max-w-2xl">{collection.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleCopyShare}
            className="inline-flex items-center gap-1.5 min-h-[44px] md:min-h-0 px-4 py-2 rounded-xl bg-[#191D2B] hover:bg-[#272B3A] border border-[#272B3A] text-xs font-medium text-[#F8FAFC] transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t('account.linkCopied')}</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>{t('account.shareList')}</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onBackHome}
            className="inline-flex items-center gap-1.5 min-h-[44px] md:min-h-0 px-4 py-2 rounded-xl bg-[#080A12] hover:bg-[#191D2B] border border-[#272B3A] text-xs font-medium text-[#A1A1AA] hover:text-[#F8FAFC] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t('account.listBackHome')}</span>
          </button>
        </div>
      </div>

      {collection.items.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {collection.items.map((entry) => {
            const key = `${entry.mediaType}-${entry.mediaId}`;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelectMediaById(entry.mediaId, entry.mediaType)}
                className="group text-left flex flex-col bg-[#111421] border border-[#272B3A] rounded-xl overflow-hidden hover:border-[#8B5CF6]/50 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
              >
                <div className="aspect-[2/3] w-full bg-[#191D2B] overflow-hidden flex items-center justify-center">
                  {entry.posterPath && !failedImages[key] ? (
                    <img
                      src={entry.posterPath}
                      alt={entry.title}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setFailedImages((prev) => ({ ...prev, [key]: true }))
                      }
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : entry.mediaType === 'tv' ? (
                    <Tv className="w-7 h-7 text-[#38BDF8] opacity-60" />
                  ) : (
                    <Film className="w-7 h-7 text-[#8B5CF6] opacity-60" />
                  )}
                </div>
                <div className="p-3 w-full space-y-1">
                  <h2 className="text-xs font-semibold text-[#F8FAFC] group-hover:text-[#38BDF8] truncate">
                    {entry.title}
                  </h2>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#858B9B]">
                    <span className="tabular-nums">{formatReleaseYear(entry.releaseDate)}</span>
                    <span>·</span>
                    <span className="text-[#38BDF8] font-mono tabular-nums">
                      {formatRating(entry.voteAverage)}
                    </span>
                    {entry.genres?.[0] && (
                      <>
                        <span>·</span>
                        <span className="truncate">{tGenre(entry.genres[0])}</span>
                      </>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center rounded-2xl border border-dashed border-[#272B3A] bg-[#111421]/50">
          <p className="text-sm text-[#858B9B]">{t('account.collectionsEmpty')}</p>
        </div>
      )}
    </div>
  );
};
