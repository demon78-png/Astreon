import React, { useState, useMemo, useEffect, useRef } from 'react';
import { NewsArticle } from '../types/entertainment';
import { ArrowLeft, Share2, Clock, Check, Newspaper } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';

interface EditorialNewsViewProps {
  articles: NewsArticle[];
  selectedArticle: NewsArticle | null;
  onSelectArticle: (article: NewsArticle | null) => void;
}

const ArticleCoverImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
}> = ({ src, alt, className = '' }) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#191D2B] text-[#858B9B] p-4 text-center">
        <Newspaper className="w-8 h-8 mb-2 opacity-60 text-[#38BDF8]" />
        <span className="text-[11px] font-mono uppercase tracking-wider line-clamp-2">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};

export const EditorialNewsView: React.FC<EditorialNewsViewProps> = ({
  articles,
  selectedArticle,
  onSelectArticle
}) => {
  const { t, formatDate } = useI18n();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copiedLink, setCopiedLink] = useState(false);
  const shareTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (shareTimerRef.current) {
        clearTimeout(shareTimerRef.current);
      }
    };
  }, []);

  const publishedArticles = articles.filter((a) => a.status !== 'draft');

  const categories = useMemo(() => {
    const derived = Array.from(new Set(publishedArticles.map((a) => a.category).filter(Boolean)));
    return ['All', ...derived];
  }, [publishedArticles]);

  const filtered = publishedArticles.filter((a) => {
    if (selectedCategory === 'All') return true;
    return a.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  const featured = publishedArticles.find((a) => a.featured) || publishedArticles[0];
  const gridArticles =
    selectedCategory === 'All' && featured && filtered.length > 1
      ? filtered.filter((a) => a.id !== featured.id)
      : filtered;

  const markCopied = () => {
    setCopiedLink(true);
    if (shareTimerRef.current) {
      clearTimeout(shareTimerRef.current);
    }
    shareTimerRef.current = setTimeout(() => {
      setCopiedLink(false);
      shareTimerRef.current = null;
    }, 2000);
  };

  const handleShare = async () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function' && selectedArticle) {
      try {
        await navigator.share({
          title: `${selectedArticle.title} — ASTREON`,
          text: selectedArticle.excerpt,
          url: shareUrl
        });
        markCopied();
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        markCopied();
      } catch {
        // Ignore denied clipboard permissions silently instead of falsely showing Copied
      }
    }
  };

  // Article Reader View
  if (selectedArticle) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-in fade-in duration-200">
        <button
          type="button"
          onClick={() => onSelectArticle(null)}
          className="inline-flex items-center gap-2 min-h-[40px] md:min-h-0 text-xs font-medium text-[#38BDF8] hover:text-cyan-300 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('editorial.back')}</span>
        </button>

        <header className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono tracking-wider text-[#8B5CF6] uppercase">
            <span>{selectedArticle.category}</span>
            <span>·</span>
            <span className="flex items-center gap-1 text-[#858B9B]">
              <Clock className="w-3 h-3" />
              {selectedArticle.readTime}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-[#F8FAFC] tracking-tight leading-tight text-balance">
            {selectedArticle.title}
          </h1>

          <p className="text-base sm:text-lg text-[#A1A1AA] leading-relaxed">
            {selectedArticle.excerpt}
          </p>

          <div className="flex items-center justify-between py-4 border-y border-[#272B3A] text-xs text-[#858B9B]">
            <div>
              <p className="text-[#F8FAFC] font-semibold">{selectedArticle.author}</p>
              <p className="text-[11px] text-[#858B9B]">{selectedArticle.authorRole}</p>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              <span>{formatDate(selectedArticle.publishedAt)}</span>
              <button
                type="button"
                onClick={handleShare}
                className="flex items-center gap-1.5 min-h-[40px] md:min-h-0 px-3 py-1.5 rounded-lg bg-[#111421] hover:bg-[#191D2B] border border-[#272B3A] text-xs text-[#A1A1AA] hover:text-[#F8FAFC] transition-colors cursor-pointer"
                title={t('editorial.share')}
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copiedLink ? t('editorial.copied') : t('editorial.share')}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Featured Image */}
        <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-[#272B3A] bg-[#080A12]">
          <ArticleCoverImage
            src={selectedArticle.image}
            alt={selectedArticle.imageAlt}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Article Body */}
        <div className="prose prose-invert max-w-none text-sm sm:text-base text-[#D4D4D8] leading-relaxed space-y-6">
          {selectedArticle.body.split('\n\n').map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </div>
    );
  }

  // News Index View
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Editorial Header */}
      <div className="space-y-2">
        <div className="text-xs font-mono uppercase tracking-widest text-[#38BDF8]">
          {t('editorial.eyebrow')}
        </div>
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-[#F8FAFC] tracking-tight">
          {t('editorial.heading')}
        </h1>
        <p className="text-sm text-[#A1A1AA] max-w-2xl">
          {t('editorial.subheading')}
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar border-b border-[#272B3A] pb-3 text-xs">
        {categories.map((cat) => (
          <button
            type="button"
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`min-h-[40px] md:min-h-0 px-3.5 py-2 md:py-1.5 rounded-lg font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              selectedCategory === cat
                ? 'bg-[#8B5CF6] text-white shadow-sm'
                : 'text-[#858B9B] hover:text-[#F8FAFC] hover:bg-[#111421]'
            }`}
          >
            {cat === 'All' ? t('editorial.all') : cat}
          </button>
        ))}
      </div>

      {/* Featured Lead Story */}
      {featured && selectedCategory === 'All' && (
        <button
          type="button"
          onClick={() => onSelectArticle(featured)}
          className="w-full text-left group relative grid grid-cols-1 lg:grid-cols-12 rounded-2xl border border-[#272B3A] bg-[#111421] overflow-hidden hover:border-[#8B5CF6]/50 transition-all cursor-pointer shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
        >
          <div className="lg:col-span-7 aspect-video lg:aspect-auto relative min-h-[220px] sm:min-h-[280px] lg:min-h-[300px] w-full">
            <ArticleCoverImage
              src={featured.image}
              alt={featured.imageAlt}
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-transparent via-[#111421]/30 to-[#111421]" />
          </div>

          <div className="lg:col-span-5 p-5 sm:p-8 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono text-[#8B5CF6] uppercase">
                <span>{t('editorial.featuredBadge')}</span>
                <span>·</span>
                <span>{featured.category}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-display font-bold text-[#F8FAFC] group-hover:text-[#38BDF8] transition-colors leading-snug text-balance">
                {featured.title}
              </h2>
              <p className="text-xs sm:text-sm text-[#A1A1AA] line-clamp-3 leading-relaxed">
                {featured.excerpt}
              </p>
            </div>

            <div className="pt-4 border-t border-[#272B3A] flex items-center justify-between text-xs text-[#858B9B]">
              <span>{t('editorial.byAuthor', { author: featured.author })}</span>
              <span>{featured.readTime}</span>
            </div>
          </div>
        </button>
      )}

      {/* Article Grid */}
      {gridArticles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {gridArticles.map((article) => (
            <button
              type="button"
              key={article.id}
              onClick={() => onSelectArticle(article)}
              className="text-left group flex flex-col rounded-2xl bg-[#111421] border border-[#272B3A] overflow-hidden hover:border-[#8B5CF6]/50 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
            >
              <div className="aspect-[16/9] w-full bg-[#191D2B] overflow-hidden">
                <ArticleCoverImage
                  src={article.image}
                  alt={article.imageAlt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              <div className="p-5 flex flex-col flex-1 justify-between space-y-3 w-full">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono text-[#38BDF8] uppercase">
                    <span>{article.category}</span>
                    <span>·</span>
                    <span>{article.readTime}</span>
                  </div>
                  <h3 className="text-base font-display font-semibold text-[#F8FAFC] group-hover:text-[#38BDF8] transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-xs text-[#858B9B] line-clamp-2 leading-relaxed">
                    {article.excerpt}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#272B3A] flex items-center justify-between text-[11px] text-[#858B9B]">
                  <span>{t('editorial.byAuthor', { author: article.author })}</span>
                  <span>{formatDate(article.publishedAt)}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center rounded-2xl border border-dashed border-[#272B3A] bg-[#111421]/50 space-y-2">
          <p className="text-sm font-semibold text-[#F8FAFC]">{t('editorial.empty')}</p>
          <p className="text-xs text-[#858B9B]">{t('editorial.emptySub')}</p>
        </div>
      )}
    </div>
  );
};
