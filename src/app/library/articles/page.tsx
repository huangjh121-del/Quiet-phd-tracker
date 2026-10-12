'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, FileText, Loader2, Pencil, X, Trash2, Search, Plus, 
  CheckCircle2, Clock, Bookmark, Sparkles, FileEdit
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import localforage from 'localforage';
import { useAuth } from '@clerk/nextjs';

interface ArticleItem {
  id: string;
  title: string;
  author?: string;
  source?: string;
  publishedAt?: string;
  content?: string;
  progress: number;
  isCompleted: boolean;
  lastReadAt: number;
  createdAt?: number;
}

const ARTICLE_CARD_THEMES = [
  {
    bg: 'bg-[#FFFDF9]',
    border: 'border-[#E7DFD5]',
    spineAccent: 'bg-[#C2410C]',
    mastheadColor: 'text-[#9A3412]',
    titleHover: 'group-hover:text-[#9A3412]',
    quoteBorder: 'border-[#EA580C]/40',
    tagBg: 'bg-[#9A3412]/10 text-[#9A3412]',
  },
  {
    bg: 'bg-[#F8F9FA]',
    border: 'border-[#DCE2EA]',
    spineAccent: 'bg-[#1D4ED8]',
    mastheadColor: 'text-[#1E3A8A]',
    titleHover: 'group-hover:text-[#1E3A8A]',
    quoteBorder: 'border-[#2563EB]/40',
    tagBg: 'bg-[#1E3A8A]/10 text-[#1E3A8A]',
  },
  {
    bg: 'bg-[#FAF6EE]',
    border: 'border-[#EADCC9]',
    spineAccent: 'bg-[#78350F]',
    mastheadColor: 'text-[#5C2E0B]',
    titleHover: 'group-hover:text-[#5C2E0B]',
    quoteBorder: 'border-[#B45309]/40',
    tagBg: 'bg-[#78350F]/10 text-[#78350F]',
  },
  {
    bg: 'bg-[#F4F7F4]',
    border: 'border-[#D1DFD4]',
    spineAccent: 'bg-[#15803D]',
    mastheadColor: 'text-[#14532D]',
    titleHover: 'group-hover:text-[#14532D]',
    quoteBorder: 'border-[#16A34A]/40',
    tagBg: 'bg-[#14532D]/10 text-[#14532D]',
  },
  {
    bg: 'bg-[#FBFBFA]',
    border: 'border-[#E4E4E7]',
    spineAccent: 'bg-[#3F3F46]',
    mastheadColor: 'text-[#18181B]',
    titleHover: 'group-hover:text-[#18181B]',
    quoteBorder: 'border-[#52525B]/40',
    tagBg: 'bg-[#27272A]/10 text-[#27272A]',
  },
];

function getThemeForArticle(id: string, title: string) {
  const sum = (id + title).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return ARTICLE_CARD_THEMES[sum % ARTICLE_CARD_THEMES.length];
}

export default function ArticleShelf() {
  const router = useRouter();
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'reading' | 'completed'>('all');

  // Edit Modal State
  const [editingArticle, setEditingArticle] = useState<ArticleItem | null>(null);
  const [editTitleInput, setEditTitleInput] = useState('');
  const [editSourceInput, setEditSourceInput] = useState('');
  const [editAuthorInput, setEditAuthorInput] = useState('');
  const [editPublishedAtInput, setEditPublishedAtInput] = useState('');
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  // Add Article Modal State
  const [isAddingArticle, setIsAddingArticle] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSource, setNewSource] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newPublishedAt, setNewPublishedAt] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isSubmittingNewArticle, setIsSubmittingNewArticle] = useState(false);

  // Fetch articles
  useEffect(() => {
    async function loadArticles() {
      if (!isLoaded) return;
      if (!isSignedIn) {
        setArticles([]);
        setIsLoading(false);
        return;
      }
      try {
        let token: string | null = null;
        try { token = await getToken(); } catch (e) {}

        const fetchHeaders: Record<string, string> = {
          'Cache-Control': 'no-cache',
        };
        if (token) fetchHeaders['Authorization'] = `Bearer ${token}`;

        // 1. Fetch cloud documents
        const res = await fetch('/api/documents?type=article&t=' + Date.now(), { headers: fetchHeaders });
        const data = await res.json();
        let cloudArticles: ArticleItem[] = [];
        if (data.documents) {
          cloudArticles = data.documents.map((d: any) => ({
            id: d.id,
            title: d.title,
            author: d.author || '',
            source: d.source || '',
            publishedAt: d.published_at || '',
            content: d.content || '',
            progress: d.percentage || 0,
            isCompleted: (d.percentage || 0) >= 100,
            lastReadAt: d.last_read_at || d.created_at || 0,
            createdAt: d.created_at || d.last_read_at || 0,
          }));
        }

        // 2. Fetch local articles fallback
        const localLib = await localforage.getItem<any[]>('quiet_library') || [];
        const localArticlesRaw = localLib.filter(b => b.category === 'article');
        
        const localArticles: ArticleItem[] = [];
        for (const b of localArticlesRaw) {
          let textSnippet = '';
          try {
            const raw = await localforage.getItem(`quiet_book_${b.id}`);
            if (typeof raw === 'string') {
              textSnippet = raw;
            } else if (raw instanceof Blob) {
              textSnippet = await raw.text();
            }
          } catch(e) {}

          localArticles.push({
            id: b.id,
            title: b.title,
            author: b.author || '',
            source: b.source || '',
            publishedAt: b.publishedAt || b.published_at || '',
            content: textSnippet,
            progress: b.progress || 0,
            isCompleted: b.isCompleted || false,
            lastReadAt: b.lastReadAt || 0,
            createdAt: b.lastReadAt || 0,
          });
        }

        // Merge
        const map = new Map<string, ArticleItem>();
        localArticles.forEach(a => map.set(a.id, a));
        cloudArticles.forEach(a => {
          const existing = map.get(a.id);
          map.set(a.id, {
            ...a,
            source: a.source || existing?.source || '',
            publishedAt: a.publishedAt || existing?.publishedAt || '',
            content: a.content || existing?.content || '',
          });
        });

        const combined = Array.from(map.values()).sort((a, b) => b.lastReadAt - a.lastReadAt);
        setArticles(combined);
      } catch (err) {
        console.error("Error loading articles:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadArticles();
  }, [isLoaded, isSignedIn]);

  // Open Edit Modal with article values
  const handleOpenEdit = (article: ArticleItem) => {
    setEditingArticle(article);
    setEditTitleInput(article.title || '');
    setEditSourceInput(article.source || '');
    setEditAuthorInput(article.author || '');
    setEditPublishedAtInput(article.publishedAt || '');
  };

  // Save changes to title, source, author, published date
  const handleSaveDetails = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingArticle || !editTitleInput.trim() || isSavingDetails) return;
    setIsSavingDetails(true);

    const trimmedTitle = editTitleInput.trim();
    const trimmedSource = editSourceInput.trim();
    const trimmedAuthor = editAuthorInput.trim();
    const trimmedPublishedAt = editPublishedAtInput.trim();

    try {
      let token: string | null = null;
      try { token = await getToken(); } catch (e) {}
      const patchHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) patchHeaders['Authorization'] = `Bearer ${token}`;

      await fetch(`/api/documents/${editingArticle.id}`, {
        method: 'PATCH',
        headers: patchHeaders,
        body: JSON.stringify({ 
          title: trimmedTitle,
          source: trimmedSource,
          author: trimmedAuthor,
          publishedAt: trimmedPublishedAt,
        }),
      });

      const localLib = await localforage.getItem<any[]>('quiet_library') || [];
      const updatedLib = localLib.map(item => 
        item.id === editingArticle.id ? { 
          ...item, 
          title: trimmedTitle,
          source: trimmedSource,
          author: trimmedAuthor,
          publishedAt: trimmedPublishedAt,
        } : item
      );
      await localforage.setItem('quiet_library', updatedLib);

      setArticles(prev => prev.map(a => a.id === editingArticle.id ? { 
        ...a, 
        title: trimmedTitle,
        source: trimmedSource,
        author: trimmedAuthor,
        publishedAt: trimmedPublishedAt,
      } : a));

      setEditingArticle(null);
    } catch (err) {
      console.error('Failed to update article details:', err);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSavingDetails(false);
    }
  };

  // Delete article
  const handleDeleteArticle = async (e: React.MouseEvent, id: string, title: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(`Are you sure you want to remove "${title}" from your article shelf?`)) {
      try {
        let token: string | null = null;
        try { token = await getToken(); } catch (e) {}
        const deleteHeaders: Record<string, string> = {};
        if (token) deleteHeaders['Authorization'] = `Bearer ${token}`;

        await fetch(`/api/documents/${id}`, {
          method: 'DELETE',
          headers: deleteHeaders,
        });

        const localLib = await localforage.getItem<any[]>('quiet_library') || [];
        const updatedLib = localLib.filter(b => b.id !== id);
        await localforage.setItem('quiet_library', updatedLib);
        await localforage.removeItem(`quiet_book_${id}`);

        setArticles(prev => prev.filter(a => a.id !== id));
      } catch (err) {
        console.error('Failed to delete article:', err);
      }
    }
  };

  // Create New Article
  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim() || isSubmittingNewArticle) return;
    setIsSubmittingNewArticle(true);

    const docId = Date.now().toString();
    const title = newTitle.trim();
    const source = newSource.trim();
    const author = newAuthor.trim();
    const publishedAt = newPublishedAt.trim();
    const content = newContent.trim();

    try {
      // 1. Save locally
      await localforage.setItem(`quiet_book_${docId}`, content);
      const newDocMeta = {
        id: docId,
        title,
        source,
        author,
        publishedAt,
        type: 'text',
        category: 'article',
        lastReadAt: Date.now(),
        progress: 0,
        isCompleted: false,
        currentLocation: 0,
        totalSize: content.length,
      };
      const localLib = await localforage.getItem<any[]>('quiet_library') || [];
      await localforage.setItem('quiet_library', [newDocMeta, ...localLib]);

      // 2. Save to cloud
      let token: string | null = null;
      try { token = await getToken(); } catch (e) {}
      const postHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) postHeaders['Authorization'] = `Bearer ${token}`;

      await fetch('/api/documents', {
        method: 'POST',
        headers: postHeaders,
        body: JSON.stringify({
          id: docId,
          type: 'article',
          title,
          source,
          author,
          publishedAt,
          fileName: `${title.slice(0, 20)}.txt`,
          fileKey: '',
          content,
          totalProgress: '',
          percentage: 0
        })
      });

      // Jump to reader
      router.push(`/reader?id=${docId}`);
    } catch (err) {
      console.error('Failed to create article:', err);
      alert('Failed to create article. Please try again.');
      setIsSubmittingNewArticle(false);
    }
  };

  // Filter articles
  const filteredArticles = useMemo(() => {
    return articles.filter(article => {
      const matchesSearch = !searchQuery.trim() || 
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (article.source && article.source.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (article.author && article.author.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (article.content && article.content.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (activeTab === 'reading') return article.progress > 0 && !article.isCompleted;
      if (activeTab === 'completed') return article.isCompleted;
      return true;
    });
  }, [articles, searchQuery, activeTab]);

  // Group into display rows of 3
  const articleRacks = useMemo(() => {
    const itemsPerRack = 3;
    const result: ArticleItem[][] = [];
    for (let i = 0; i < filteredArticles.length; i += itemsPerRack) {
      result.push(filteredArticles.slice(i, i + itemsPerRack));
    }
    return result;
  }, [filteredArticles]);

  // Stats
  const stats = useMemo(() => {
    const total = articles.length;
    const completed = articles.filter(a => a.isCompleted).length;
    const reading = articles.filter(a => a.progress > 0 && !a.isCompleted).length;
    return { total, completed, reading };
  }, [articles]);

  return (
    <div className="min-h-screen bg-[#F6F4EE] text-[#1C1C1C] flex flex-col relative selection:bg-[#E2E8F0]">
      {/* Top Header */}
      <header className="border-b border-[#E7E2D6] bg-[#FAF8F5]/90 backdrop-blur-md sticky top-0 z-30 transition-all">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white hover:shadow-sm border border-transparent hover:border-[#E5E5E5] text-[#6B7280] hover:text-[#111827] transition-all"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C2410C] bg-[#FFF1EB] px-2 py-0.5 rounded border border-[#FED7AA]">
                  Article Shelf
                </span>
                <span className="text-xs text-[#8C7A6B] font-serif">· Saved Articles & Essays</span>
              </div>
              <h1 className="font-serif font-bold text-xl md:text-2xl text-[#111827]">
                Articles
              </h1>
            </div>
          </div>

          {/* Quick Add Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setNewTitle('');
                setNewSource('');
                setNewAuthor('');
                setNewPublishedAt('');
                setNewContent('');
                setIsAddingArticle(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#C2410C] hover:bg-[#9A3412] text-white rounded-xl text-xs md:text-sm font-semibold shadow-sm hover:shadow transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Article</span>
            </button>
          </div>
        </div>
      </header>

      {/* Info & Filters Bar */}
      <div className="bg-[#FAF8F5] border-b border-[#E7E2D6] py-6 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Stats Bar */}
          <div className="flex items-center gap-4 text-xs font-serif text-[#6B7280]">
            <div className="flex items-center gap-1.5 bg-white border border-[#E7E2D6] px-3 py-1.5 rounded-lg shadow-2xs">
              <FileText className="w-4 h-4 text-[#C2410C]" />
              <span>Total Articles <strong className="text-[#111827] font-sans font-bold">{stats.total}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 bg-white border border-[#E7E2D6] px-3 py-1.5 rounded-lg shadow-2xs">
              <Bookmark className="w-4 h-4 text-[#D97706]" />
              <span>In Progress <strong className="text-[#111827] font-sans font-bold">{stats.reading}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 bg-white border border-[#E7E2D6] px-3 py-1.5 rounded-lg shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
              <span>Completed <strong className="text-[#111827] font-sans font-bold">{stats.completed}</strong></span>
            </div>
          </div>

          {/* Search & Tabs */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, source, or text..."
                className="pl-9 pr-3 py-1.5 bg-white border border-[#E7E2D6] rounded-lg text-xs md:text-sm text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C2410C] transition-all w-52 md:w-64"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#111827]">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center bg-[#EFECE6] p-1 rounded-lg border border-[#E2DDD3]">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  activeTab === 'all' 
                    ? 'bg-white text-[#111827] shadow-xs font-bold' 
                    : 'text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                All ({articles.length})
              </button>
              <button
                onClick={() => setActiveTab('reading')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  activeTab === 'reading' 
                    ? 'bg-white text-[#111827] shadow-xs font-bold' 
                    : 'text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                Reading ({stats.reading})
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  activeTab === 'completed' 
                    ? 'bg-white text-[#111827] shadow-xs font-bold' 
                    : 'text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                Completed ({stats.completed})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Article Shelf Gallery */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-12">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-28 text-[#6B7280] space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-[#C2410C]" />
            <p className="font-serif text-sm">Opening article shelf...</p>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-24 bg-white/70 border border-[#E7E2D6] rounded-3xl max-w-lg mx-auto shadow-sm p-8">
            <div className="w-16 h-16 rounded-full bg-[#FFF1EB] flex items-center justify-center mx-auto mb-4 text-[#C2410C]">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="font-serif font-bold text-lg text-[#111827] mb-2">No Articles Found</h3>
            <p className="text-xs md:text-sm text-[#6B7280] mb-6 leading-relaxed">
              {searchQuery ? 'No articles matched your search query.' : 'Add your reading articles or paste long-form content to organize them beautifully.'}
            </p>
            <button
              onClick={() => {
                setNewTitle('');
                setNewSource('');
                setNewAuthor('');
                setNewPublishedAt('');
                setNewContent('');
                setIsAddingArticle(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C2410C] text-white rounded-xl text-sm font-semibold shadow hover:bg-[#9A3412] transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Your First Article</span>
            </button>
          </div>
        ) : (
          /* Article Display Racks */
          <div className="space-y-16 md:space-y-20 pt-4">
            {articleRacks.map((rackArticles, rackIdx) => (
              <div key={rackIdx} className="relative">
                {/* Articles in this rack */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-2 md:px-6 items-end">
                  {rackArticles.map((article) => {
                    const theme = getThemeForArticle(article.id, article.title);
                    const excerpt = article.content ? article.content.slice(0, 140).replace(/\s+/g, ' ') : '';
                    const wordCount = article.content ? article.content.trim().split(/\s+/).length : 0;
                    const readTimeMins = Math.max(1, Math.ceil(wordCount / 180));

                    // Use user's real source or fall back to 'ARTICLE'
                    const displaySource = article.source?.trim() ? article.source.trim().toUpperCase() : 'ARTICLE';
                    // Use user's real published date or date added
                    const displayDate = article.publishedAt?.trim() 
                      ? article.publishedAt.trim() 
                      : (article.lastReadAt 
                          ? new Date(article.lastReadAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) 
                          : 'RECENT');

                    return (
                      <div 
                        key={article.id} 
                        className="group relative flex flex-col transition-all duration-300 hover:-translate-y-3 z-10"
                      >
                        {/* Authentic Editorial Article Card */}
                        <Link 
                          href={`/reader?id=${article.id}`} 
                          className="block w-full"
                        >
                          <div 
                            className={`relative min-h-[380px] rounded-2xl ${theme.bg} border-2 ${theme.border} p-6 flex flex-col justify-between overflow-hidden shadow-[4px_12px_24px_rgba(0,0,0,0.08),1px_2px_4px_rgba(0,0,0,0.04)] group-hover:shadow-[8px_24px_36px_rgba(0,0,0,0.15)] transition-all duration-300 select-none`}
                          >
                            {/* Magazine Spine & Staple Stitching Accent (Left) */}
                            <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/10 via-black/5 to-transparent border-r border-[#E5E5E5]/60 z-20 pointer-events-none" />
                            {/* Metallic Staple 1 */}
                            <div className="absolute left-1.5 top-12 w-1 h-3.5 bg-[#94A3B8] rounded-xs shadow-[1px_1px_2px_rgba(0,0,0,0.15)] z-20 pointer-events-none" />
                            {/* Metallic Staple 2 */}
                            <div className="absolute left-1.5 bottom-12 w-1 h-3.5 bg-[#94A3B8] rounded-xs shadow-[1px_1px_2px_rgba(0,0,0,0.15)] z-20 pointer-events-none" />

                            {/* Top Source & Date Bar */}
                            <div className="relative z-10 pl-2 border-b border-[#E7E2D6] pb-3 mb-4">
                              <div className="flex items-center justify-between text-[11px] font-sans font-bold tracking-[0.15em] uppercase mb-1">
                                <span className={`${theme.mastheadColor} truncate max-w-[180px]`}>
                                  {displaySource}
                                </span>
                                <span className="text-[#8C7A6B] bg-[#EFECE6] px-2 py-0.5 rounded text-[10px] font-mono shrink-0">
                                  {displayDate}
                                </span>
                              </div>
                            </div>

                            {/* Headline Title */}
                            <div className="relative z-10 pl-2 my-auto">
                              <h3 
                                className={`font-serif font-bold text-lg md:text-xl leading-snug text-[#1E293B] ${theme.titleHover} transition-colors line-clamp-3 mb-2`}
                                title={article.title}
                              >
                                {article.title}
                              </h3>

                              {article.author && article.author.trim() && (
                                <p className="text-xs italic text-[#78716C] mb-3 font-serif line-clamp-1">
                                  By {article.author}
                                </p>
                              )}

                              {/* Editorial Abstract Snippet */}
                              {excerpt ? (
                                <div className={`text-xs text-[#57534E] leading-relaxed italic bg-black/[0.02] p-3 rounded-xl border-l-2 ${theme.quoteBorder} line-clamp-3 font-serif`}>
                                  &ldquo;{excerpt}...&rdquo;
                                </div>
                              ) : (
                                <div className="text-xs text-[#8C7A6B] italic font-serif opacity-75">
                                  Click to read and collect vocabulary...
                                </div>
                              )}
                            </div>

                            {/* Bottom Editorial Bar & Stamp */}
                            <div className="relative z-10 pl-2 mt-auto pt-4 border-t border-[#E7E2D6] flex items-center justify-between">
                              <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#8C7A6B]">
                                <Clock className="w-3.5 h-3.5 text-[#C2410C]" />
                                <span>{readTimeMins} MIN READ</span>
                              </div>

                              {/* Rubber Stamp Status */}
                              {article.isCompleted ? (
                                <div className="border border-[#15803D] text-[#15803D] bg-[#DCFCE7]/60 -rotate-3 px-2.5 py-0.5 text-[9px] font-mono font-bold tracking-widest rounded uppercase shadow-2xs">
                                  COMPLETED
                                </div>
                              ) : article.progress > 0 ? (
                                <div className="border border-[#D97706] text-[#D97706] bg-[#FEF3C7]/60 px-2 py-0.5 text-[9px] font-mono font-bold tracking-wider rounded uppercase flex items-center gap-1">
                                  <span>READING</span>
                                  <span>{article.progress}%</span>
                                </div>
                              ) : (
                                <div className="border border-[#64748B] text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 text-[9px] font-mono font-semibold tracking-wider rounded uppercase">
                                  NEW
                                </div>
                              )}
                            </div>
                          </div>
                        </Link>

                        {/* Quick Hover Actions Menu */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute -top-3 right-0 flex items-center gap-1 bg-white/95 backdrop-blur-md border border-[#E5E5E5] p-1 rounded-xl shadow-lg z-30">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleOpenEdit(article);
                            }}
                            className="p-1.5 text-[#6B7280] hover:text-[#C2410C] hover:bg-[#FFF1EB] rounded-lg transition-colors cursor-pointer"
                            title="Edit details (source, title, date)"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteArticle(e, article.id, article.title)}
                            className="p-1.5 text-[#6B7280] hover:text-[#EF4444] hover:bg-[#FEF2F2] rounded-lg transition-colors cursor-pointer"
                            title="Remove article"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Article Display Rack Ledge */}
                <div className="relative w-full mt-[-4px] select-none pointer-events-none">
                  {/* Top rack surface with metallic / wood grain gloss */}
                  <div className="h-2 w-full bg-gradient-to-r from-[#D7CCC8] via-[#EFEBE9] to-[#D7CCC8] border-t border-[#DFD3C3] shadow-inner rounded-t-xs" />
                  {/* Front display lip holding articles upright */}
                  <div className="h-4 w-full bg-gradient-to-b from-[#8D6E63] via-[#6D4C41] to-[#4E342E] shadow-[0_10px_20px_rgba(40,20,10,0.2),0_2px_4px_rgba(0,0,0,0.1)] rounded-b-xs border-b border-[#3E2723]" />
                  {/* Drop shadow on wall */}
                  <div className="h-4 w-full bg-gradient-to-b from-black/12 to-transparent blur-xs" />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Edit Article Details Modal */}
      {editingArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111827]/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="bg-[#FAF9F6] border border-[#E5E5E5] rounded-3xl max-w-md w-full p-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileEdit className="w-5 h-5 text-[#C2410C]" />
                <h3 className="font-serif font-bold text-lg text-[#111827]">
                  Edit Article Details
                </h3>
              </div>
              <button 
                onClick={() => setEditingArticle(null)} 
                className="text-[#9CA3AF] hover:text-[#111827] p-1.5 rounded-full hover:bg-black/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDetails} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-1.5">
                  Article Title
                </label>
                <input
                  type="text"
                  required
                  value={editTitleInput}
                  onChange={(e) => setEditTitleInput(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#E5E5E5] rounded-xl text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#C2410C] transition-all font-serif"
                  placeholder="Enter article title..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-1.5">
                  Source / Publication (Optional)
                </label>
                <input
                  type="text"
                  value={editSourceInput}
                  onChange={(e) => setEditSourceInput(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#E5E5E5] rounded-xl text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#C2410C] transition-all font-serif"
                  placeholder="e.g. The Economist, The Guardian, Substack..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-1.5">
                    Author (Optional)
                  </label>
                  <input
                    type="text"
                    value={editAuthorInput}
                    onChange={(e) => setEditAuthorInput(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E5E5E5] rounded-xl text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#C2410C] transition-all font-serif"
                    placeholder="e.g. Ed Yong"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-1.5">
                    Date (Optional)
                  </label>
                  <input
                    type="text"
                    value={editPublishedAtInput}
                    onChange={(e) => setEditPublishedAtInput(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E5E5E5] rounded-xl text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#C2410C] transition-all font-serif"
                    placeholder="e.g. Oct 8, 2026"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingArticle(null)}
                  className="px-4 py-2 text-sm font-medium text-[#6B7280] hover:text-[#111827] rounded-xl hover:bg-black/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingDetails || !editTitleInput.trim()}
                  className="px-5 py-2 text-sm font-semibold text-white bg-[#C2410C] hover:bg-[#9A3412] rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isSavingDetails && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Article Modal */}
      {isAddingArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111827]/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="bg-[#FAF9F6] border border-[#E5E5E5] rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#C2410C]" />
                <h3 className="font-serif font-bold text-xl text-[#111827]">
                  Add New Article
                </h3>
              </div>
              <button 
                onClick={() => setIsAddingArticle(false)} 
                className="text-[#9CA3AF] hover:text-[#111827] p-1.5 rounded-full hover:bg-black/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateArticle} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-1.5">
                  Article Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Why Deep Work Matters in Modern Life..."
                  className="w-full px-4 py-2.5 bg-white border border-[#E5E5E5] rounded-xl text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#C2410C] transition-all font-serif"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-1.5">
                  Source / Publication (Optional)
                </label>
                <input
                  type="text"
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  placeholder="e.g. The Economist, Substack, Medium..."
                  className="w-full px-4 py-2.5 bg-white border border-[#E5E5E5] rounded-xl text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#C2410C] transition-all font-serif"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-1.5">
                    Author (Optional)
                  </label>
                  <input
                    type="text"
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    placeholder="e.g. Cal Newport"
                    className="w-full px-3 py-2 bg-white border border-[#E5E5E5] rounded-xl text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#C2410C] transition-all font-serif"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-1.5">
                    Date (Optional)
                  </label>
                  <input
                    type="text"
                    value={newPublishedAt}
                    onChange={(e) => setNewPublishedAt(e.target.value)}
                    placeholder="e.g. Oct 8, 2026"
                    className="w-full px-3 py-2 bg-white border border-[#E5E5E5] rounded-xl text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#C2410C] transition-all font-serif"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-1.5">
                  Article Content (Text)
                </label>
                <textarea
                  required
                  rows={8}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Paste article text here..."
                  className="w-full px-4 py-3 bg-white border border-[#E5E5E5] rounded-xl text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#C2410C] transition-all font-serif resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingArticle(false)}
                  className="px-4 py-2 text-sm font-medium text-[#6B7280] hover:text-[#111827] rounded-xl hover:bg-black/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNewArticle || !newTitle.trim() || !newContent.trim()}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-[#C2410C] hover:bg-[#9A3412] rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isSubmittingNewArticle && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save & Start Reading
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
