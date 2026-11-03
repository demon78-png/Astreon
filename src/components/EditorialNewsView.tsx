import React, { useState } from 'react';
import { NewsArticle } from '../types/entertainment';
import { ArrowLeft, Share2, Clock, Check } from 'lucide-react';

interface EditorialNewsViewProps {
  articles: NewsArticle[];
  selectedArticle: NewsArticle | null;
  onSelectArticle: (article: NewsArticle | null) => void;
}

export const EditorialNewsView: React.FC<EditorialNewsViewProps> = ({
  articles,
  selectedArticle,
  onSelectArticle
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copiedLink, setCopiedLink] = useState(false);

  const categories = ['All', 'Deep Dive', 'Industry', 'Curation'];

  const filtered = articles.filter((a) => {
    if (selectedCategory === 'All') return true;
    return a.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  const featured = articles.find((a) => a.featured) || articles[0];

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Article Reader View
  if (selectedArticle) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-in fade-in duration-200">
        <button
          onClick={() => onSelectArticle(null)}
          className="inline-flex items-center gap-2 text-xs font-medium text-[#38BDF8] hover:text-cyan-300 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Editorial Dispatches</span>
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

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-[#F8FAFC] tracking-tight leading-tight">
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

            <div className="flex items-center gap-4">
              <span>{new Date(selectedArticle.publishedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111421] hover:bg-[#191D2B] border border-[#272B3A] text-xs text-[#A1A1AA] hover:text-[#F8FAFC] transition-colors cursor-pointer"
                title="Copy article link"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Share'}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Featured Image */}
        <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-[#272B3A] bg-[#080A12]">
          <img
            src={selectedArticle.image}
            alt={selectedArticle.imageAlt}
            referrerPolicy="no-referrer"
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
          ASTREON Editorial & Curation
        </div>
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-[#F8FAFC] tracking-tight">
          Cinema & Television Dispatches
        </h1>
        <p className="text-sm text-[#A1A1AA] max-w-2xl">
          Longform critique, director retrospectives, festival reporting, and curated guides to noteworthy moving pictures.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 border-b border-[#272B3A] pb-3 text-xs">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              selectedCategory === cat
                ? 'bg-[#8B5CF6] text-white shadow-sm'
                : 'text-[#858B9B] hover:text-[#F8FAFC] hover:bg-[#111421]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Featured Lead Story */}
      {featured && selectedCategory === 'All' && (
        <div
          onClick={() => onSelectArticle(featured)}
          className="group relative grid grid-cols-1 lg:grid-cols-12 rounded-2xl border border-[#272B3A] bg-[#111421] overflow-hidden hover:border-[#8B5CF6]/50 transition-all cursor-pointer shadow-xl"
        >
          <div className="lg:col-span-7 aspect-video lg:aspect-auto relative min-h-[300px]">
            <img
              src={featured.image}
              alt={featured.imageAlt}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-transparent via-[#111421]/30 to-[#111421]" />
          </div>

          <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono text-[#8B5CF6] uppercase">
                <span>Featured Feature</span>
                <span>·</span>
                <span>{featured.category}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-display font-bold text-[#F8FAFC] group-hover:text-[#38BDF8] transition-colors leading-snug">
                {featured.title}
              </h2>
              <p className="text-xs sm:text-sm text-[#A1A1AA] line-clamp-3 leading-relaxed">
                {featured.excerpt}
              </p>
            </div>

            <div className="pt-4 border-t border-[#272B3A] flex items-center justify-between text-xs text-[#858B9B]">
              <span>By {featured.author}</span>
              <span>{featured.readTime}</span>
            </div>
          </div>
        </div>
      )}

      {/* Article Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((article) => (
          <article
            key={article.id}
            onClick={() => onSelectArticle(article)}
            className="group flex flex-col rounded-2xl bg-[#111421] border border-[#272B3A] overflow-hidden hover:border-[#8B5CF6]/50 transition-all cursor-pointer"
          >
            <div className="aspect-[16/9] w-full bg-[#191D2B] overflow-hidden">
              <img
                src={article.image}
                alt={article.imageAlt}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>

            <div className="p-5 flex flex-col flex-1 justify-between space-y-3">
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
                <span>By {article.author}</span>
                <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
