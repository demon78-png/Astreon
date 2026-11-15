import React, { useState, useEffect, useRef } from 'react';
import { MediaItem, NewsArticle, UserReview, AdminAuditLog } from '../types/entertainment';
import {
  getAdminMetrics,
  getAdminAuditLogs,
  setFeaturedMedia,
  publishNewsArticle,
  updateNewsArticle,
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
  Radio,
  Pencil,
  Eye,
  EyeOff,
  Users,
  TrendingUp,
  Search,
  RotateCcw,
  BarChart3
} from 'lucide-react';
import { testFirestoreConnection, fetchAdminUserAnalytics } from '../services/firebase';
import {
  loadUsageTelemetry,
  resetUsageTelemetry,
  computePopularTitles,
  computeTopSearchQueries,
  computeUsageSummary,
  UsageTelemetryStore
} from '../utils/analytics';

interface AdminConsoleProps {
  mediaList: MediaItem[];
  currentFeaturedId: number;
  adminEmail?: string;
  onFeaturedUpdated: (newFeaturedId: number) => void;
  articles: NewsArticle[];
  onArticlePublished: (article: NewsArticle) => void;
  onArticleUpdated: (article: NewsArticle) => void;
  reviews: UserReview[];
  onReviewModerated: (id: string, status: 'published' | 'flagged') => void;
}

export const AdminConsole: React.FC<AdminConsoleProps> = ({
  mediaList,
  currentFeaturedId,
  adminEmail = 'danny2010qwert@gmail.com',
  onFeaturedUpdated,
  articles,
  onArticlePublished,
  onArticleUpdated,
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
  const featuredTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSelectedFeaturedId(currentFeaturedId);
  }, [currentFeaturedId]);

  useEffect(() => {
    return () => {
      if (featuredTimerRef.current) {
        clearTimeout(featuredTimerRef.current);
      }
    };
  }, []);

  // Article Publishing / Editing Form state
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newExcerpt, setNewExcerpt] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newCategory, setNewCategory] = useState<'Curation' | 'Industry' | 'Festival' | 'Spotlight' | 'Deep Dive'>('Deep Dive');
  const [newAuthor, setNewAuthor] = useState('ASTREON Editorial Board');
  const [newImage, setNewImage] = useState('');
  const [articleSubmitting, setArticleSubmitting] = useState(false);
  const [articleSuccess, setArticleSuccess] = useState('');
  const [articleError, setArticleError] = useState('');

  // Audit Log filter state
  const [auditActionFilter, setAuditActionFilter] = useState<string>('ALL');
  const [auditSearch, setAuditSearch] = useState('');

  // Client-side Usage Dashboard state
  const [telemetry, setTelemetry] = useState<UsageTelemetryStore>(() => loadUsageTelemetry());
  const [recentSearchTerms, setRecentSearchTerms] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('astreon_recent_searches');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [firestoreUserCount, setFirestoreUserCount] = useState<number | null>(null);
  const [userGenreLists, setUserGenreLists] = useState<string[][]>([]);
  const [popularTypeFilter, setPopularTypeFilter] = useState<'all' | 'movie' | 'tv'>('all');
  const [refreshingUsage, setRefreshingUsage] = useState(false);

  const loadUsageAnalytics = async () => {
    setRefreshingUsage(true);
    setTelemetry(loadUsageTelemetry());
    try {
      const rawRecent = localStorage.getItem('astreon_recent_searches');
      setRecentSearchTerms(rawRecent ? JSON.parse(rawRecent) : []);
    } catch {
      setRecentSearchTerms([]);
    }
    const [metricsRes, auditRes, userAnalytics] = await Promise.all([
      getAdminMetrics(),
      getAdminAuditLogs(),
      fetchAdminUserAnalytics().catch(() => ({ userCount: null, userGenreLists: [] }))
    ]);
    setMetrics(metricsRes);
    setAuditLogs(auditRes);
    setFirestoreUserCount(userAnalytics.userCount);
    setUserGenreLists(userAnalytics.userGenreLists);
    setRefreshingUsage(false);
  };

  useEffect(() => {
    loadUsageAnalytics();
  }, []);

  const handleResetTelemetry = () => {
    const empty = resetUsageTelemetry();
    setTelemetry(empty);
  };

  const usageSummary = computeUsageSummary({
    mediaList,
    reviews,
    telemetry,
    firestoreUserCount,
    userGenreLists
  });

  const popularTitles = computePopularTitles({
    mediaList,
    reviews,
    telemetry,
    typeFilter: popularTypeFilter,
    limit: 6
  });

  const topSearchQueries = computeTopSearchQueries({
    telemetry,
    recentSearches: recentSearchTerms,
    limit: 7
  });

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
    const success = await setFeaturedMedia(selectedFeaturedId, adminEmail);
    if (success) {
      onFeaturedUpdated(selectedFeaturedId);
      setFeaturedSuccess(true);
      if (featuredTimerRef.current) {
        clearTimeout(featuredTimerRef.current);
      }
      featuredTimerRef.current = setTimeout(() => {
        setFeaturedSuccess(false);
        featuredTimerRef.current = null;
      }, 2500);
      getAdminAuditLogs().then(setAuditLogs);
      getAdminMetrics().then(setMetrics);
    }
  };

  const startEditArticle = (art: NewsArticle) => {
    setEditingArticle(art);
    setNewTitle(art.title);
    setNewExcerpt(art.excerpt);
    setNewBody(art.body);
    setNewCategory(art.category);
    setNewAuthor(art.author);
    setNewImage(art.image);
    setArticleError('');
    setArticleSuccess('');
  };

  const resetArticleForm = () => {
    setEditingArticle(null);
    setNewTitle('');
    setNewExcerpt('');
    setNewBody('');
    setNewImage('');
    setNewAuthor('ASTREON Editorial Board');
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

    if (editingArticle) {
      const updated = await updateNewsArticle(
        editingArticle,
        {
          title: newTitle.trim(),
          excerpt: newExcerpt.trim() || newTitle.trim(),
          body: newBody.trim(),
          category: newCategory,
          author: newAuthor.trim() || 'ASTREON Editorial Board',
          image: newImage.trim() || editingArticle.image,
          imageAlt: newTitle.trim()
        },
        adminEmail
      );
      setArticleSubmitting(false);
      if (updated) {
        onArticleUpdated(updated);
        setArticleSuccess(`Updated dispatch "${updated.title}".`);
        resetArticleForm();
        getAdminAuditLogs().then(setAuditLogs);
        getAdminMetrics().then(setMetrics);
      } else {
        setArticleError('Failed to save article updates.');
      }
      return;
    }

    const res = await publishNewsArticle(
      {
        title: newTitle.trim(),
        excerpt: newExcerpt.trim() || newTitle.trim(),
        body: newBody.trim(),
        category: newCategory,
        author: newAuthor.trim(),
        image: newImage.trim() || 'https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s520DRq.jpg',
        imageAlt: newTitle.trim()
      },
      adminEmail
    );

    setArticleSubmitting(false);
    if (res) {
      onArticlePublished(res);
      setArticleSuccess(`Article "${res.title}" successfully published.`);
      resetArticleForm();
      getAdminAuditLogs().then(setAuditLogs);
      getAdminMetrics().then(setMetrics);
    } else {
      setArticleError('Failed to publish editorial article.');
    }
  };

  const handleToggleArticleStatus = async (art: NewsArticle) => {
    const nextStatus: 'published' | 'draft' = art.status === 'draft' ? 'published' : 'draft';
    const updated = await updateNewsArticle(art, { status: nextStatus }, adminEmail);
    if (updated) {
      onArticleUpdated(updated);
      getAdminAuditLogs().then(setAuditLogs);
      getAdminMetrics().then(setMetrics);
    }
  };

  const handleToggleReviewStatus = async (review: UserReview) => {
    const nextStatus = review.status === 'flagged' ? 'published' : 'flagged';
    const ok = await moderateReview(review.id, nextStatus, adminEmail);
    if (ok) {
      onReviewModerated(review.id, nextStatus);
      getAdminAuditLogs().then(setAuditLogs);
      getAdminMetrics().then(setMetrics);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-6 rounded-2xl bg-[#111421] border border-amber-500/30">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-display font-bold text-[#F8FAFC]">
              ASTREON Administrative Command
            </h1>
            <p className="text-xs text-[#858B9B]">
              Role-authorized content curation, editorial CMS, and community moderation
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-[#080A12] border border-[#272B3A] rounded-xl text-xs overflow-x-auto hide-scrollbar w-full xl:w-auto">
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
                className={`flex items-center gap-1.5 min-h-[40px] md:min-h-0 px-3 py-2 md:py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  active ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-[#858B9B] hover:text-[#F8FAFC]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: OVERVIEW & CLIENT-SIDE USAGE DASHBOARD */}
      {activeTab === 'metrics' && (
        <div className="space-y-6" data-testid="admin-usage-dashboard">
          {/* Section Header + Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-display font-bold text-[#F8FAFC]">
                Platform Usage &amp; Discovery Analytics
              </h2>
              <p className="text-xs text-[#858B9B]">
                Live client-side engagement telemetry, catalog trends, and registered user metrics
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={loadUsageAnalytics}
                disabled={refreshingUsage}
                data-testid="refresh-usage-stats"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111421] hover:bg-[#191D2B] border border-[#272B3A] text-xs font-medium text-[#F8FAFC] transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#38BDF8] ${refreshingUsage ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <button
                type="button"
                onClick={handleResetTelemetry}
                data-testid="reset-usage-telemetry"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111421] hover:bg-[#191D2B] border border-[#272B3A] text-xs font-medium text-[#A1A1AA] hover:text-[#F8FAFC] transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Telemetry</span>
              </button>
            </div>
          </div>

          {/* Primary KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-4 rounded-xl bg-[#111421] border border-[#272B3A]">
              <div className="flex items-center justify-between text-[#858B9B]">
                <p className="text-[11px] uppercase font-mono">User Count</p>
                <Users className="w-3.5 h-3.5 text-[#38BDF8]" />
              </div>
              <p
                className="text-2xl font-display font-bold text-[#F8FAFC] mt-1 tabular-nums"
                data-testid="kpi-user-count"
              >
                {usageSummary.userCount}
              </p>
              <p className="text-[11px] text-[#858B9B] mt-0.5 truncate">
                {firestoreUserCount !== null ? 'Firestore profiles' : 'Active session profiles'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#111421] border border-[#272B3A]">
              <div className="flex items-center justify-between text-[#858B9B]">
                <p className="text-[11px] uppercase font-mono">Title Views</p>
                <TrendingUp className="w-3.5 h-3.5 text-[#8B5CF6]" />
              </div>
              <p
                className="text-2xl font-display font-bold text-[#38BDF8] mt-1 tabular-nums"
                data-testid="kpi-title-views"
              >
                {usageSummary.totalTitleViews}
              </p>
              <p className="text-[11px] text-[#858B9B] mt-0.5 tabular-nums">
                +{usageSummary.totalTrailerPlays} trailer plays
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#111421] border border-[#272B3A]">
              <div className="flex items-center justify-between text-[#858B9B]">
                <p className="text-[11px] uppercase font-mono">Search Queries</p>
                <Search className="w-3.5 h-3.5 text-[#38BDF8]" />
              </div>
              <p
                className="text-2xl font-display font-bold text-[#8B5CF6] mt-1 tabular-nums"
                data-testid="kpi-search-queries"
              >
                {usageSummary.totalSearches}
              </p>
              <p className="text-[11px] text-[#858B9B] mt-0.5 tabular-nums">
                {usageSummary.uniqueSearchTerms} unique terms
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#111421] border border-[#272B3A]">
              <p className="text-[11px] text-[#858B9B] uppercase font-mono">Catalog Titles</p>
              <p className="text-2xl font-display font-bold text-[#F8FAFC] mt-1 tabular-nums">
                {metrics?.catalogCount ?? mediaList.length}
              </p>
              <p className="text-[11px] text-[#858B9B] mt-0.5 tabular-nums">
                {metrics?.moviesCount ?? mediaList.filter((m) => m.mediaType === 'movie').length} films ·{' '}
                {metrics?.tvCount ?? mediaList.filter((m) => m.mediaType === 'tv').length} series
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#111421] border border-[#272B3A]">
              <p className="text-[11px] text-[#858B9B] uppercase font-mono">Reviews</p>
              <p className="text-2xl font-display font-bold text-[#F8FAFC] mt-1 tabular-nums">
                {reviews.length}
              </p>
              <p className="text-[11px] text-[#858B9B] mt-0.5 tabular-nums">
                Avg {usageSummary.avgCommunityRating || '0.0'}/10 · {reviews.filter((r) => r.status === 'flagged').length} flagged
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#111421] border border-[#272B3A]">
              <p className="text-[11px] text-[#858B9B] uppercase font-mono">Dispatches</p>
              <p className="text-2xl font-display font-bold text-emerald-400 mt-1 tabular-nums">
                {articles.filter((a) => a.status !== 'draft').length}
              </p>
              <p className="text-[11px] text-[#858B9B] mt-0.5 tabular-nums">
                {articles.length} total articles
              </p>
            </div>
          </div>

          {/* 2-Column Usage Charts & Rankings */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Popular Titles Panel */}
            <section
              className="lg:col-span-7 p-6 rounded-2xl bg-[#111421] border border-[#272B3A] space-y-4"
              data-testid="popular-titles-panel"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-display font-semibold text-[#F8FAFC] flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#38BDF8]" />
                    <span>Popular Titles</span>
                  </h3>
                  <p className="text-xs text-[#858B9B] mt-0.5">
                    Ranked by detail views, trailer plays, community reviews, and TMDB score
                  </p>
                </div>

                {/* Segmented media type filter */}
                <div className="flex items-center gap-1 p-1 bg-[#080A12] border border-[#272B3A] rounded-lg text-xs self-start sm:self-auto">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'movie', label: 'Films' },
                    { id: 'tv', label: 'Series' }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPopularTypeFilter(opt.id as 'all' | 'movie' | 'tv')}
                      className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                        popularTypeFilter === opt.id
                          ? 'bg-[#8B5CF6] text-white'
                          : 'text-[#858B9B] hover:text-[#F8FAFC]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {popularTitles.length > 0 ? (
                <div className="divide-y divide-[#272B3A]">
                  {popularTitles.map((entry, idx) => (
                    <div key={entry.mediaId} className="py-3 first:pt-1 last:pb-1 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="font-mono text-xs text-[#858B9B] tabular-nums w-5 shrink-0">
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-semibold text-[#F8FAFC] truncate">
                              {entry.title}
                            </p>
                            <p className="text-[11px] text-[#858B9B] tabular-nums">
                              {entry.mediaType === 'movie' ? 'Film' : 'Series'} · TMDB {entry.voteAverage.toFixed(1)} · {entry.views}{' '}
                              {entry.views === 1 ? 'view' : 'views'} · {entry.trailerPlays}{' '}
                              {entry.trailerPlays === 1 ? 'trailer' : 'trailers'} · {entry.reviewCount}{' '}
                              {entry.reviewCount === 1 ? 'review' : 'reviews'}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-semibold text-[#38BDF8] tabular-nums shrink-0">
                          {entry.engagementScore} pts
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-[#191D2B] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#38BDF8] to-[#8B5CF6] transition-all duration-300"
                          style={{ width: `${entry.sharePct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center space-y-1">
                  <p className="text-xs font-medium text-[#F8FAFC]">No titles available in this filter</p>
                  <p className="text-[11px] text-[#858B9B]">Switch to All to inspect full catalog engagement.</p>
                </div>
              )}
            </section>

            {/* Top Search Queries + Genre Affinity Panel */}
            <section
              className="lg:col-span-5 p-6 rounded-2xl bg-[#111421] border border-[#272B3A] space-y-5"
              data-testid="top-searches-panel"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-display font-semibold text-[#F8FAFC] flex items-center gap-2">
                      <Search className="w-4 h-4 text-[#8B5CF6]" />
                      <span>Top Search Queries</span>
                    </h3>
                    <p className="text-xs text-[#858B9B] mt-0.5">
                      Most frequent discovery inquiries captured client-side
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-[#858B9B] tabular-nums shrink-0">
                    {topSearchQueries.length} listed
                  </span>
                </div>

                {topSearchQueries.length > 0 ? (
                  <div className="divide-y divide-[#272B3A]">
                    {topSearchQueries.map((qEntry) => (
                      <div key={qEntry.query.toLowerCase()} className="py-2.5 first:pt-1 last:pb-1 space-y-1.5">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-medium text-[#F8FAFC] truncate">
                            {qEntry.query}
                          </span>
                          <span className="font-mono text-[#38BDF8] tabular-nums shrink-0">
                            {qEntry.count} {qEntry.count === 1 ? 'search' : 'searches'}
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-[#191D2B] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#8B5CF6] transition-all duration-300"
                            style={{ width: `${qEntry.sharePct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center space-y-1">
                    <p className="text-xs font-medium text-[#F8FAFC]">No search queries recorded yet</p>
                    <p className="text-[11px] text-[#858B9B]">
                      Run a search via the navbar Search bar to populate query rankings.
                    </p>
                  </div>
                )}
              </div>

              {/* Audience Genre Affinity */}
              <div className="pt-5 border-t border-[#272B3A] space-y-3">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#858B9B]">
                    Top Genre Affinity
                  </h4>
                  <p className="text-[11px] text-[#858B9B] mt-0.5">
                    {userGenreLists.length > 0
                      ? 'Aggregated from registered Firestore user profiles'
                      : 'Aggregated from active catalog genre distribution'}
                  </p>
                </div>

                <div className="space-y-2.5">
                  {usageSummary.topGenres.map((g) => (
                    <div key={g.genre} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#F8FAFC]">{g.genre}</span>
                        <span className="font-mono text-[11px] text-[#858B9B] tabular-nums">
                          {g.count}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-[#191D2B] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#38BDF8]"
                          style={{ width: `${g.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form onSubmit={handlePublishArticle} className="lg:col-span-7 p-6 rounded-2xl bg-[#111421] border border-[#272B3A] space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-display font-bold text-[#F8FAFC]">
                  {editingArticle ? `Editing: ${editingArticle.title}` : 'Publish Original Editorial Article'}
                </h3>
                <p className="text-xs text-[#858B9B] mt-0.5">
                  {editingArticle
                    ? 'Revise copy, artwork, or metadata for this editorial dispatch'
                    : 'Draft original criticism, curation guides, or festival reports'}
                </p>
              </div>
              {editingArticle && (
                <button
                  type="button"
                  onClick={resetArticleForm}
                  className="px-3 py-1 rounded-lg bg-[#191D2B] text-xs text-[#A1A1AA] hover:text-[#F8FAFC] border border-[#272B3A] cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
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
              {articleSubmitting
                ? 'Saving...'
                : editingArticle
                ? 'Save Article Changes'
                : 'Publish to Editorial Desk'}
            </button>
          </form>

          {/* Manage Existing Dispatches */}
          <div className="lg:col-span-5 p-6 rounded-2xl bg-[#111421] border border-[#272B3A] space-y-4">
            <div>
              <h3 className="text-base font-display font-bold text-[#F8FAFC]">
                Manage Dispatches ({articles.length})
              </h3>
              <p className="text-xs text-[#858B9B] mt-0.5">
                Edit copy or toggle visibility between published and draft
              </p>
            </div>

            <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
              {articles.map((art) => {
                const isDraft = art.status === 'draft';
                return (
                  <div
                    key={art.id}
                    className={`p-3.5 rounded-xl border space-y-2.5 ${
                      isDraft
                        ? 'bg-[#080A12]/70 border-amber-500/30'
                        : 'bg-[#080A12] border-[#272B3A]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2 text-[10px] font-mono uppercase">
                          <span className="text-[#38BDF8]">{art.category}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded ${
                              isDraft
                                ? 'bg-amber-500/15 text-amber-300'
                                : 'bg-emerald-500/15 text-emerald-300'
                            }`}
                          >
                            {isDraft ? 'draft' : 'published'}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-[#F8FAFC] line-clamp-2">
                          {art.title}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => startEditArticle(art)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#191D2B] hover:bg-[#272B3A] text-[11px] font-medium text-[#F8FAFC] border border-[#272B3A] cursor-pointer"
                      >
                        <Pencil className="w-3 h-3 text-[#38BDF8]" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleArticleStatus(art)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#191D2B] hover:bg-[#272B3A] text-[11px] font-medium text-[#A1A1AA] hover:text-[#F8FAFC] border border-[#272B3A] cursor-pointer"
                      >
                        {isDraft ? (
                          <>
                            <Eye className="w-3 h-3 text-emerald-400" />
                            <span>Publish</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3 text-amber-400" />
                            <span>Unpublish</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-display font-bold text-[#F8FAFC]">
                System & Administrative Audit Log
              </h3>
              <p className="text-xs text-[#858B9B]">
                Immutable record of editorial, curation, and moderation events
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <select
                aria-label="Filter audit logs by action"
                value={auditActionFilter}
                onChange={(e) => setAuditActionFilter(e.target.value)}
                className="bg-[#191D2B] text-[#F8FAFC] border border-[#272B3A] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#8B5CF6] cursor-pointer"
              >
                <option value="ALL">All Actions</option>
                {Array.from(new Set(auditLogs.map((l) => l.action))).map((act) => (
                  <option key={act} value={act}>
                    {act}
                  </option>
                ))}
              </select>

              <input
                type="text"
                aria-label="Search audit log details or actor"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="Search actor or details..."
                className="bg-[#191D2B] text-[#F8FAFC] placeholder-[#858B9B] border border-[#272B3A] rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#8B5CF6] w-44"
              />
            </div>
          </div>

          <div className="space-y-2">
            {auditLogs
              .filter((log) => {
                if (auditActionFilter !== 'ALL' && log.action !== auditActionFilter) return false;
                if (auditSearch.trim()) {
                  const q = auditSearch.toLowerCase();
                  return (
                    log.actor.toLowerCase().includes(q) ||
                    log.details.toLowerCase().includes(q) ||
                    String(log.targetId).toLowerCase().includes(q)
                  );
                }
                return true;
              })
              .map((log) => (
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
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
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
