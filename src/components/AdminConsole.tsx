import React, { useState, useEffect } from 'react';
import { MediaItem, NewsArticle, UserReview, AdminAuditLog } from '../types/entertainment';
import {
  getAdminMetrics,
  getAdminAuditLogs,
  setFeaturedMedia,
  publishNewsArticle,
  moderateReview
} from '../services/api';
import {
  Shield,
  Sparkles,
  Newspaper,
  MessageSquare,
  ListFilter,
  Check,
  AlertCircle,
  Database,
  Server,
  RefreshCw,
  Lock,
  KeyRound,
  Radio
} from 'lucide-react';
import { testFirestoreConnection } from '../services/firebase';

interface AdminConsoleProps {
  mediaList: MediaItem[];
  currentFeaturedId: number;
  onFeaturedUpdated: (newFeaturedId: number) => void;
  onArticlePublished: (article: NewsArticle) => void;
  reviews: UserReview[];
  onReviewModerated: (id: string, status: 'published' | 'flagged') => void;
}

export const AdminConsole: React.FC<AdminConsoleProps> = ({
  mediaList,
  currentFeaturedId,
  onFeaturedUpdated,
  onArticlePublished,
  reviews,
  onReviewModerated
}) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [activeTab, setActiveTab] = useState<'metrics' | 'featured' | 'article' | 'reviews' | 'audit' | 'firebase'>('metrics');
  const [firestoreStatus, setFirestoreStatus] = useState<'idle' | 'testing' | 'connected' | 'offline'>('idle');
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  // Featured Media Switcher state
  const [selectedFeaturedId, setSelectedFeaturedId] = useState<number>(currentFeaturedId);
  const [featuredSuccess, setFeaturedSuccess] = useState(false);

  // Article Publishing Form state
  const [newTitle, setNewTitle] = useState('');
  const [newExcerpt, setNewExcerpt] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newCategory, setNewCategory] = useState<'Curation' | 'Industry' | 'Festival' | 'Spotlight' | 'Deep Dive'>('Deep Dive');
  const [newAuthor, setNewAuthor] = useState('ASTREON Editorial Board');
  const [newImage, setNewImage] = useState('');
  const [articleSubmitting, setArticleSubmitting] = useState(false);
  const [articleSuccess, setArticleSuccess] = useState('');
  const [articleError, setArticleError] = useState('');

  useEffect(() => {
    getAdminMetrics().then(setMetrics);
    getAdminAuditLogs().then(setAuditLogs);
  }, []);

  const handleTestFirestore = async () => {
    setFirestoreStatus('testing');
    const start = performance.now();
    try {
      const ok = await testFirestoreConnection();
      const end = performance.now();
      setLatencyMs(Math.round(end - start));
      setFirestoreStatus(ok ? 'connected' : 'offline');
    } catch {
      setFirestoreStatus('offline');
    }
  };

  const handleUpdateFeatured = async () => {
    const success = await setFeaturedMedia(selectedFeaturedId, 'admin@astreon.org');
    if (success) {
      onFeaturedUpdated(selectedFeaturedId);
      setFeaturedSuccess(true);
      setTimeout(() => setFeaturedSuccess(false), 2500);
      getAdminAuditLogs().then(setAuditLogs);
    }
  };

  const handlePublishArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newBody.trim()) {
      setArticleError('Article title and body content are required.');
      return;
    }
    setArticleSubmitting(true);
    setArticleError('');
    setArticleSuccess('');

    const res = await publishNewsArticle({
      title: newTitle.trim(),
      excerpt: newExcerpt.trim() || newTitle.trim(),
      body: newBody.trim(),
      category: newCategory,
      author: newAuthor.trim(),
      image: newImage.trim() || 'https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s520DRq.jpg',
      imageAlt: newTitle.trim()
    }, 'admin@astreon.org');

    setArticleSubmitting(false);
    if (res) {
      onArticlePublished(res);
      setArticleSuccess(`Article "${res.title}" successfully published.`);
      setNewTitle('');
      setNewExcerpt('');
      setNewBody('');
      setNewImage('');
      getAdminAuditLogs().then(setAuditLogs);
    } else {
      setArticleError('Failed to publish editorial article.');
    }
  };

  const handleToggleReviewStatus = async (review: UserReview) => {
    const nextStatus = review.status === 'flagged' ? 'published' : 'flagged';
    const ok = await moderateReview(review.id, nextStatus, 'admin@astreon.org');
    if (ok) {
      onReviewModerated(review.id, nextStatus);
      getAdminAuditLogs().then(setAuditLogs);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#111421] border border-amber-500/30">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-[#F8FAFC]">
              ASTREON Administrative Command
            </h1>
            <p className="text-xs text-[#858B9B]">
              Role-authorized content curation, editorial CMS, and community moderation
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#080A12] border border-[#272B3A] rounded-xl text-xs">
          {[
            { id: 'metrics', label: 'Overview', icon: ListFilter },
            { id: 'firebase', label: 'Firebase & Cloud', icon: Database },
            { id: 'featured', label: 'Hero Spotlight', icon: Sparkles },
            { id: 'article', label: 'Publish Article', icon: Newspaper },
            { id: 'reviews', label: 'Moderate Reviews', icon: MessageSquare },
            { id: 'audit', label: 'Audit Log', icon: Shield }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  active ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-[#858B9B] hover:text-[#F8FAFC]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: METRICS */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-4 rounded-xl bg-[#111421] border border-[#272B3A]">
              <p className="text-[11px] text-[#858B9B] uppercase font-mono">Catalog Titles</p>
              <p className="text-2xl font-display font-bold text-[#F8FAFC] mt-1 tabular-nums">
                {metrics?.catalogCount ?? mediaList.length}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#111421] border border-[#272B3A]">
              <p className="text-[11px] text-[#858B9B] uppercase font-mono">Films</p>
              <p className="text-2xl font-display font-bold text-[#38BDF8] mt-1 tabular-nums">
                {metrics?.moviesCount ?? mediaList.filter((m) => m.mediaType === 'movie').length}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#111421] border border-[#272B3A]">
              <p className="text-[11px] text-[#858B9B] uppercase font-mono">TV Series</p>
              <p className="text-2xl font-display font-bold text-[#8B5CF6] mt-1 tabular-nums">
                {metrics?.tvCount ?? mediaList.filter((m) => m.mediaType === 'tv').length}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#111421] border border-[#272B3A]">
              <p className="text-[11px] text-[#858B9B] uppercase font-mono">Total Reviews</p>
              <p className="text-2xl font-display font-bold text-[#F8FAFC] mt-1 tabular-nums">
                {reviews.length}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#111421] border border-[#272B3A]">
              <p className="text-[11px] text-[#858B9B] uppercase font-mono">Flagged</p>
              <p className="text-2xl font-display font-bold text-rose-400 mt-1 tabular-nums">
                {reviews.filter((r) => r.status === 'flagged').length}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#111421] border border-[#272B3A]">
              <p className="text-[11px] text-[#858B9B] uppercase font-mono">Published Articles</p>
              <p className="text-2xl font-display font-bold text-emerald-400 mt-1 tabular-nums">
                {metrics?.publishedArticles ?? 3}
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#111421] border border-[#272B3A] space-y-2">
            <h3 className="text-sm font-display font-semibold text-[#F8FAFC]">
              Current Hero Spotlight Title
            </h3>
            <p className="text-xs text-[#38BDF8]">
              {mediaList.find((m) => m.id === currentFeaturedId)?.title || 'Dune: Part Two'}
            </p>
            <p className="text-xs text-[#858B9B]">
              Switch to the Hero Spotlight tab to curate which release headlines the discovery experience for all visitors.
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: HERO SPOTLIGHT CURATION */}
      {activeTab === 'featured' && (
        <div className="max-w-xl p-6 rounded-2xl bg-[#111421] border border-[#272B3A] space-y-5">
          <div>
            <h3 className="text-base font-display font-bold text-[#F8FAFC]">
              Curate Homepage Hero Title
            </h3>
            <p className="text-xs text-[#858B9B] mt-1">
              Select which verified title appears with high-resolution artwork, synopsis, and authorized trailer on the main landing page.
            </p>
          </div>

          <div className="space-y-3">
            <label htmlFor="select-hero-title" className="block text-xs font-medium text-[#A1A1AA]">
              Select Title from Catalog:
            </label>
            <select
              id="select-hero-title"
              value={selectedFeaturedId}
              onChange={(e) => setSelectedFeaturedId(Number(e.target.value))}
              className="w-full bg-[#191D2B] text-[#F8FAFC] border border-[#272B3A] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#8B5CF6]"
            >
              {mediaList.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title} ({m.mediaType === 'movie' ? 'Film' : 'Series'}) — TMDB {m.voteAverage}
                </option>
              ))}
            </select>
          </div>

          {featuredSuccess && (
            <p className="text-xs text-emerald-400 flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>Hero spotlight successfully updated in live configuration!</span>
            </p>
          )}

          <button
            onClick={handleUpdateFeatured}
            className="py-2.5 px-5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Deploy as Hero Spotlight
          </button>
        </div>
      )}

      {/* TAB 3: EDITORIAL CMS */}
      {activeTab === 'article' && (
        <form onSubmit={handlePublishArticle} className="max-w-2xl p-6 rounded-2xl bg-[#111421] border border-[#272B3A] space-y-4">
          <div>
            <h3 className="text-base font-display font-bold text-[#F8FAFC]">
              Publish Original Editorial Article
            </h3>
            <p className="text-xs text-[#858B9B] mt-0.5">
              Draft original criticism, curation guides, or festival reports
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-[#A1A1AA] mb-1">Article Headline</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. The Acoustic Landscape of Modern Cinema"
                className="w-full bg-[#191D2B] text-[#F8FAFC] placeholder-[#858B9B] border border-[#272B3A] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="article-category-select" className="block text-xs font-medium text-[#A1A1AA] mb-1">Editorial Category</label>
                <select
                  id="article-category-select"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full bg-[#191D2B] text-[#F8FAFC] border border-[#272B3A] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#8B5CF6]"
                >
                  <option value="Deep Dive">Deep Dive</option>
                  <option value="Curation">Curation</option>
                  <option value="Industry">Industry</option>
                  <option value="Festival">Festival</option>
                  <option value="Spotlight">Spotlight</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#A1A1AA] mb-1">Author Name</label>
                <input
                  type="text"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  className="w-full bg-[#191D2B] text-[#F8FAFC] border border-[#272B3A] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#A1A1AA] mb-1">Lead Excerpt / Summary</label>
              <input
                type="text"
                value={newExcerpt}
                onChange={(e) => setNewExcerpt(e.target.value)}
                placeholder="1-2 sentences capturing the thesis of the article..."
                className="w-full bg-[#191D2B] text-[#F8FAFC] placeholder-[#858B9B] border border-[#272B3A] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#A1A1AA] mb-1">Cover Image URL (Optional)</label>
              <input
                type="text"
                value={newImage}
                onChange={(e) => setNewImage(e.target.value)}
                placeholder="https://image.tmdb.org/t/p/original/..."
                className="w-full bg-[#191D2B] text-[#F8FAFC] placeholder-[#858B9B] border border-[#272B3A] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#A1A1AA] mb-1">Article Body (Paragraphs)</label>
              <textarea
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                rows={6}
                placeholder="Write your article paragraphs here. Separate paragraphs with double enter..."
                className="w-full bg-[#191D2B] text-[#F8FAFC] placeholder-[#858B9B] border border-[#272B3A] rounded-xl p-3 text-xs focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>
          </div>

          {articleError && (
            <p className="text-xs text-rose-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{articleError}</span>
            </p>
          )}

          {articleSuccess && (
            <p className="text-xs text-emerald-400 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>{articleSuccess}</span>
            </p>
          )}

          <button
            type="submit"
            disabled={articleSubmitting}
            className="py-2.5 px-6 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-50 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            {articleSubmitting ? 'Publishing...' : 'Publish to Editorial Desk'}
          </button>
        </form>
      )}

      {/* TAB 4: REVIEW MODERATION */}
      {activeTab === 'reviews' && (
        <div className="p-6 rounded-2xl bg-[#111421] border border-[#272B3A] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-display font-bold text-[#F8FAFC]">
                Community Review Moderation
              </h3>
              <p className="text-xs text-[#858B9B]">
                Review user submissions, handle reported content, and toggle visibility status
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {reviews.map((r) => {
              const isFlagged = r.status === 'flagged';
              return (
                <div
                  key={r.id}
                  className={`p-4 rounded-xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isFlagged
                      ? 'bg-rose-500/10 border-rose-500/30'
                      : 'bg-[#080A12] border-[#272B3A]'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#F8FAFC]">{r.userName}</span>
                      <span className="text-[11px] font-mono text-[#38BDF8]">Rating: {r.rating}/10</span>
                      <span
                        className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded ${
                          isFlagged ? 'bg-rose-600 text-white' : 'bg-emerald-500/20 text-emerald-400'
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#A1A1AA] max-w-xl">{r.reviewText}</p>
                    <p className="text-[10px] text-[#858B9B]">
                      Submitted: {new Date(r.createdAt).toLocaleDateString()} · Media ID #{r.mediaId}
                    </p>
                  </div>

                  <button
                    onClick={() => handleToggleReviewStatus(r)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto shrink-0 ${
                      isFlagged
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-rose-600/80 hover:bg-rose-600 text-white'
                    }`}
                  >
                    {isFlagged ? 'Approve & Restore' : 'Flag & Quarantine'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT LOG */}
      {activeTab === 'audit' && (
        <div className="p-6 rounded-2xl bg-[#111421] border border-[#272B3A] space-y-4">
          <div>
            <h3 className="text-base font-display font-bold text-[#F8FAFC]">
              System & Administrative Audit Log
            </h3>
            <p className="text-xs text-[#858B9B]">
              Immutable record of editorial, curation, and moderation events
            </p>
          </div>

          <div className="space-y-2">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-[#080A12] border border-[#272B3A] flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2 font-mono"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 font-semibold">{log.action}</span>
                    <span className="text-[#858B9B]">by {log.actor}</span>
                  </div>
                  <p className="text-[#A1A1AA] font-sans text-xs mt-0.5">{log.details}</p>
                </div>
                <span className="text-[#858B9B] text-[11px] shrink-0">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: FIREBASE & CLOUD INFRASTRUCTURE */}
      {activeTab === 'firebase' && (
        <div className="space-y-6">
          {/* Status & Diagnostic Header */}
          <div className="p-6 rounded-2xl bg-[#111421] border border-[#38BDF8]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="text-base font-display font-bold text-[#F8FAFC]">
                  Google Cloud Firestore & Firebase Auth Status
                </h3>
              </div>
              <p className="text-xs text-[#858B9B]">
                Active configuration for ASTREON entertainment discovery persistence and identity
              </p>
            </div>

            <button
              onClick={handleTestFirestore}
              disabled={firestoreStatus === 'testing'}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#38BDF8]/10 hover:bg-[#38BDF8]/20 border border-[#38BDF8]/30 text-[#38BDF8] text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${firestoreStatus === 'testing' ? 'animate-spin' : ''}`} />
              <span>{firestoreStatus === 'testing' ? 'Testing Connection...' : 'Ping Firestore DB'}</span>
            </button>
          </div>

          {/* Latency & Connectivity Result */}
          {firestoreStatus !== 'idle' && (
            <div
              className={`p-4 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                firestoreStatus === 'connected'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : firestoreStatus === 'offline'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 shrink-0" />
                <span>
                  {firestoreStatus === 'connected'
                    ? `Live Firestore heartbeat verified. Round-trip server response: ${latencyMs}ms.`
                    : firestoreStatus === 'offline'
                    ? 'Firestore endpoint currently operating in offline cache mode.'
                    : 'Transmitting probe ping to provisioned Firestore node...'}
                </span>
              </div>
              {latencyMs !== null && (
                <span className="font-mono text-[11px] font-semibold">{latencyMs} ms</span>
              )}
            </div>
          )}

          {/* Provisioning Specs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#111421] border border-[#272B3A] space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-[#858B9B]">
                <Server className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span className="uppercase font-mono text-[10px]">Cloud Project ID</span>
              </div>
              <p className="text-xs font-mono font-semibold text-[#F8FAFC] truncate">
                gen-lang-client-0119106237
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#111421] border border-[#272B3A] space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-[#858B9B]">
                <Database className="w-3.5 h-3.5 text-[#8B5CF6]" />
                <span className="uppercase font-mono text-[10px]">Firestore Database ID</span>
              </div>
              <p className="text-xs font-mono font-semibold text-[#F8FAFC] truncate" title="ai-studio-astreon-62c32054-27f2-4bee-a80d-98620e463670">
                ai-studio-astreon-62c32054...
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#111421] border border-[#272B3A] space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-[#858B9B]">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span className="uppercase font-mono text-[10px]">Root Administrator</span>
              </div>
              <p className="text-xs font-mono font-semibold text-amber-300 truncate">
                danny2010qwert@gmail.com
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#111421] border border-[#272B3A] space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-[#858B9B]">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span className="uppercase font-mono text-[10px]">Security Rules Engine</span>
              </div>
              <p className="text-xs font-semibold text-emerald-300">
                ABAC / Catch-All Deny
              </p>
            </div>
          </div>

          {/* Provisioned Schema Matrix */}
          <div className="p-6 rounded-2xl bg-[#111421] border border-[#272B3A] space-y-4">
            <div>
              <h4 className="text-sm font-display font-bold text-[#F8FAFC]">
                Provisioned Firestore Collections (Master Prompt Section 19)
              </h4>
              <p className="text-xs text-[#858B9B]">
                Schema blueprints and real-time security rules deployed to Cloud Firestore
              </p>
            </div>

            <div className="divide-y divide-[#272B3A] text-xs">
              {[
                {
                  path: '/users/{uid}',
                  description: 'User profile, preferred genres, notification settings & identity tokens',
                  access: 'Owner or Admin read/write; admin list'
                },
                {
                  path: '/users/{uid}/watchlist/{entryId}',
                  description: 'Private user watchlist items with movie/tv metadata snapshot',
                  access: 'Owner private read/write only'
                },
                {
                  path: '/users/{uid}/favorites/{entryId}',
                  description: 'Private user favourite titles collection',
                  access: 'Owner private read/write only'
                },
                {
                  path: '/users/{uid}/searchHistory/{entryId}',
                  description: 'Private discovery queries with retention timestamps',
                  access: 'Owner private read/write only'
                },
                {
                  path: '/reviews/{reviewId}',
                  description: 'Public community reviews, 1-10 scores, and moderation states',
                  access: 'Public read; authenticated author create/update/delete; admin moderate'
                },
                {
                  path: '/news/{articleId}',
                  description: 'ASTREON editorial magazine articles, critiques, and festival reports',
                  access: 'Public read; admin write only'
                },
                {
                  path: '/reports/{reportId}',
                  description: 'User-submitted moderation flags for objectionable content',
                  access: 'Reporter and Admin read; signed-in create; admin resolve'
                },
                {
                  path: '/siteSettings/{documentId}',
                  description: 'Global discovery configurations and curated hero spotlight title',
                  access: 'Public read; admin write only'
                },
                {
                  path: '/adminAuditLogs/{logId}',
                  description: 'Immutable ledger of editorial, curation, and moderation events',
                  access: 'Admin read; authorized actor create; immutable update/delete'
                }
              ].map((item, idx) => (
                <div key={idx} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="font-mono text-[#38BDF8] font-semibold">{item.path}</span>
                    <p className="text-[#A1A1AA] text-[11px]">{item.description}</p>
                  </div>
                  <span className="text-[11px] font-mono text-[#858B9B] bg-[#080A12] px-2.5 py-1 rounded-lg border border-[#272B3A] self-start sm:self-auto shrink-0">
                    {item.access}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
