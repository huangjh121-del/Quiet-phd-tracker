'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, FileText, Loader2, Pencil, X } from 'lucide-react';
import Link from 'next/link';
import localforage from 'localforage';
import { useAuth } from '@clerk/nextjs';

export default function ArticleShelf() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [articles, setArticles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingArticle, setEditingArticle] = useState<any | null>(null);
  const [editTitleInput, setEditTitleInput] = useState('');
  const [isSavingTitle, setIsSavingTitle] = useState(false);

  const handleSaveTitle = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingArticle || !editTitleInput.trim() || isSavingTitle) return;
    setIsSavingTitle(true);
    const trimmedTitle = editTitleInput.trim();

    try {
      let token: string | null = null;
      try { token = await getToken(); } catch (e) {}
      const patchHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) patchHeaders['Authorization'] = `Bearer ${token}`;

      await fetch(`/api/documents/${editingArticle.id}`, {
        method: 'PATCH',
        headers: patchHeaders,
        body: JSON.stringify({ title: trimmedTitle }),
      });

      const localLib = await localforage.getItem<any[]>('quiet_library') || [];
      const updatedLib = localLib.map(item => 
        item.id === editingArticle.id ? { ...item, title: trimmedTitle } : item
      );
      await localforage.setItem('quiet_library', updatedLib);

      setArticles(prev => prev.map(a => a.id === editingArticle.id ? { ...a, title: trimmedTitle } : a));
      setEditingArticle(null);
    } catch (err) {
      console.error('Failed to update title:', err);
      alert('保存失败，请稍后重试');
    } finally {
      setIsSavingTitle(false);
    }
  };

  useEffect(() => {
    async function loadArticles() {
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
        let cloudArticles: any[] = [];
        if (data.documents) {
          cloudArticles = data.documents.map((d: any) => ({
            id: d.id,
            title: d.title,
            progress: d.percentage || 0,
            isCompleted: (d.percentage || 0) >= 100,
            lastReadAt: d.last_read_at || 0,
          }));
        }

        // 2. Fetch local articles fallback
        const localLib = await localforage.getItem<any[]>('quiet_library') || [];
        const localArticles = localLib
          .filter(b => b.category === 'article')
          .map(b => ({
            id: b.id,
            title: b.title,
            progress: b.progress || 0,
            isCompleted: b.isCompleted || false,
            lastReadAt: b.lastReadAt || 0,
          }));

        // 3. Auto-sync any local-only articles to Cloudflare D1
        for (const localArt of localArticles) {
          const alreadyInCloud = cloudArticles.some(ca => ca.id === localArt.id || ca.title === localArt.title);
          if (!alreadyInCloud) {
            try {
              let content = '';
              const fileBlob = await localforage.getItem(`quiet_book_${localArt.id}`);
              if (fileBlob instanceof Blob) {
                content = await fileBlob.text();
              } else if (typeof fileBlob === 'string') {
                content = fileBlob;
              }
              const syncHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
              if (token) syncHeaders['Authorization'] = `Bearer ${token}`;

              const syncRes = await fetch('/api/documents', {
                method: 'POST',
                headers: syncHeaders,
                body: JSON.stringify({
                  id: localArt.id,
                  type: 'article',
                  title: localArt.title,
                  author: 'Pasted Text',
                  fileName: `${localArt.title.slice(0, 20)}.txt`,
                  fileKey: '',
                  content: content,
                  totalProgress: '',
                  percentage: localArt.isCompleted ? 100 : (localArt.progress || 0)
                })
              });
              if (syncRes.ok) {
                const syncData = await syncRes.json();
                if (syncData.document) {
                  cloudArticles.push({
                    id: syncData.document.id,
                    title: syncData.document.title,
                    progress: localArt.progress || 0,
                    isCompleted: localArt.isCompleted || false,
                    lastReadAt: localArt.lastReadAt || Date.now()
                  });
                }
              }
            } catch(e) {
              console.warn("Auto sync article error:", e);
            }
          }
        }

        // Merge
        const map = new Map();
        localArticles.forEach(a => map.set(a.id, a));
        cloudArticles.forEach(a => map.set(a.id, a));

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

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1C1C1C] flex flex-col relative selection:bg-[#E2E8F0]">
      <header className="h-20 border-b border-[#E5E5E5] flex items-center px-8 bg-white/50 backdrop-blur-md sticky top-0 z-10">
        <Link href="/" className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white hover:shadow-sm border border-transparent hover:border-[#E5E5E5] text-[#6B7280] hover:text-[#111827] transition-all mr-6">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-serif font-bold text-xl text-[#111827]">Article Shelf</h1>
      </header>

      <main className="flex-1 p-8 md:p-16 max-w-5xl mx-auto w-full">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-[#3D5A80]" /></div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20 text-[#6B7280]">Your article shelf is empty. Upload or paste an article from the dashboard.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <div key={article.id} className="group relative bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-full bg-[#E07A5F]/10 flex items-center justify-center text-[#E07A5F] group-hover:scale-110 transition-transform">
                      <FileText className="w-5 h-5" />
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setEditingArticle(article);
                        setEditTitleInput(article.title);
                      }}
                      className="p-1.5 text-[#9CA3AF] hover:text-[#E07A5F] hover:bg-[#E07A5F]/10 rounded-lg transition-colors cursor-pointer"
                      title="修改文章名 / Edit title"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                  <Link href={`/reader?id=${article.id}`} className="block">
                    <h3 className="font-serif font-bold text-lg leading-tight text-[#111827] line-clamp-3 mb-2 hover:text-[#E07A5F] transition-colors">{article.title}</h3>
                  </Link>
                </div>
                <Link href={`/reader?id=${article.id}`} className="mt-auto pt-4 flex justify-between items-center text-xs font-bold text-[#6B7280]">
                  <span>{article.lastReadAt ? new Date(article.lastReadAt).toLocaleDateString() : 'Recent'}</span>
                  
                  {article.isCompleted ? (
                    <span className="bg-[#5B8266]/10 text-[#5B8266] px-2 py-1 rounded-md uppercase tracking-widest">Completed</span>
                  ) : article.progress > 0 ? (
                    <span className="bg-[#111827] text-white px-2 py-1 rounded-md">{article.progress}% Read</span>
                  ) : (
                    <span className="bg-[#F3F4F6] px-2 py-1 rounded-md uppercase tracking-widest text-[#6B7280]">New</span>
                  )}
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Edit Title Modal */}
      {editingArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111827]/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="bg-[#FAF9F6] border border-[#E5E5E5] rounded-3xl max-w-md w-full p-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif font-bold text-lg text-[#111827]">
                修改文章标题
              </h3>
              <button 
                onClick={() => setEditingArticle(null)} 
                className="text-[#9CA3AF] hover:text-[#111827] p-1.5 rounded-full hover:bg-black/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTitle}>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-2">
                文章标题 (Article Title)
              </label>
              <input
                type="text"
                value={editTitleInput}
                onChange={(e) => setEditTitleInput(e.target.value)}
                autoFocus
                className="w-full px-4 py-3 bg-white border border-[#E5E5E5] rounded-xl text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#3D5A80] focus:border-transparent mb-6 transition-all font-serif"
                placeholder="请输入新文章标题..."
              />

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingArticle(null)}
                  className="px-4 py-2 text-sm font-medium text-[#6B7280] hover:text-[#111827] rounded-xl hover:bg-black/5 transition-colors cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSavingTitle || !editTitleInput.trim()}
                  className="px-5 py-2 text-sm font-semibold text-white bg-[#111827] hover:bg-[#3D5A80] rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isSavingTitle && <Loader2 className="w-4 h-4 animate-spin" />}
                  保存修改
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
