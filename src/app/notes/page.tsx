'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, BookOpen, Trash2, ArrowUpRight, Search, Pencil, Check, X, Highlighter, MessageSquare } from "lucide-react";
import Link from 'next/link';
import localforage from 'localforage';
import { useAuth } from '@clerk/nextjs';
import { useReadingTimer } from '@/lib/readingTracker';

interface ReadingNote {
  id: string;
  user_id: string;
  book_id: string;
  source_title: string;
  highlighted_text: string;
  note: string;
  location: string;
  created_at: number;
  updated_at: number;
}

export default function ReadingNotesPage() {
  useReadingTimer();
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [notes, setNotes] = useState<ReadingNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setNotes([]);
      setIsLoading(false);
      return;
    }

    (async () => {
      let token: string | null = null;
      try { token = await getToken(); } catch (e) {}
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // 1. Fetch notes from D1 API
      fetch('/api/notes?t=' + Date.now(), { headers })
        .then(res => res.json())
        .then(data => {
          if (data.notes) {
            setNotes(data.notes);
            localforage.setItem('quiet_notes', data.notes).catch(() => {});
          }
          setIsLoading(false);
        })
        .catch(async () => {
          setIsLoading(false);
        });
    })();
  }, [isLoaded, isSignedIn]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reading note?')) return;
    try {
      setNotes(prev => prev.filter(n => n.id !== id));
      await fetch(`/api/notes/${id}`, { method: 'DELETE' });
      const current = await localforage.getItem<ReadingNote[]>('quiet_notes') || [];
      await localforage.setItem('quiet_notes', current.filter(n => n.id !== id));
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  };

  const handleStartEdit = (note: ReadingNote) => {
    setEditingNoteId(note.id);
    setEditingNoteText(note.note || '');
  };

  const handleSaveEdit = async (id: string) => {
    setIsSavingEdit(true);
    try {
      const trimmed = editingNoteText.trim();
      setNotes(prev => prev.map(n => n.id === id ? { ...n, note: trimmed, updated_at: Date.now() } : n));
      
      await fetch(`/api/notes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: trimmed })
      });

      const current = await localforage.getItem<ReadingNote[]>('quiet_notes') || [];
      await localforage.setItem('quiet_notes', current.map(n => n.id === id ? { ...n, note: trimmed, updated_at: Date.now() } : n));

      setEditingNoteId(null);
    } catch (err) {
      console.error("Failed to update note commentary:", err);
      alert("Failed to save note edit");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const filteredNotes = notes.filter(n => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (n.highlighted_text || '').toLowerCase().includes(q) ||
      (n.note || '').toLowerCase().includes(q) ||
      (n.source_title || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#F6F4EE] text-[#1C1C1C] font-sans selection:bg-[#E2E8F0]">
      {/* Top Header */}
      <header className="border-b border-[#E7E2D6] bg-[#FAF8F5]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-18 flex items-center justify-between">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#8C7A6B] hover:text-[#111827] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Desk</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-[#3D5A80] bg-[#3D5A80]/10 px-2.5 py-1 rounded">
              {notes.length} Notes Recorded
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6 md:p-12 space-y-10">
        {/* Title & Introduction */}
        <div className="space-y-3 border-b border-[#E7E2D6] pb-8">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-[#8C7A6B] uppercase">
              Field Notes
            </span>
            <span className="text-xs text-[#8C7A6B]">·</span>
            <span className="text-xs text-[#8C7A6B] font-serif">Personal Annotations & Quotes</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-serif text-[#111827]">
            Reading Notes
          </h1>
          <p className="text-[#6B7280] font-serif italic text-base md:text-lg max-w-2xl">
            Passages, reflections, and arguments highlighted from your reading, indexed with direct portals back into the original texts.
          </p>
        </div>

        {/* Search & Stats Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#8C7A6B] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search highlights or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-[#E7E2D6] rounded-xl text-xs md:text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#3D5A80] font-serif"
            />
          </div>
        </div>

        {/* Notes Feed */}
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center text-[#8C7A6B]">
            <Loader2 className="w-8 h-8 animate-spin mb-3 text-[#3D5A80]" />
            <p className="text-sm font-serif">Loading reading notes...</p>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="bg-[#FAF8F5] border border-dashed border-[#D7CCC8] rounded-3xl p-12 text-center flex flex-col items-center justify-center">
            <Highlighter className="w-10 h-10 text-[#8C7A6B] opacity-40 mb-3" />
            <h3 className="font-serif font-bold text-lg text-[#111827] mb-1">
              {searchQuery ? 'No matching notes found' : 'No Reading Notes Yet'}
            </h3>
            <p className="text-xs text-[#8C7A6B] max-w-sm mb-6">
              While reading any book or article in your library, select text and choose &ldquo;Add Note&rdquo; to collect passages and write reflections.
            </p>
            <Link
              href="/library/books"
              className="px-5 py-2.5 bg-[#1E293B] hover:bg-[#334155] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              Open Library Books
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredNotes.map((note) => {
              const dateStr = note.created_at 
                ? new Date(note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : '';

              const isEditing = editingNoteId === note.id;

              return (
                <div 
                  key={note.id}
                  className="bg-[#FAF8F5] border border-[#E7E2D6] rounded-3xl p-6 md:p-8 hover:shadow-md transition-shadow duration-300 relative group"
                >
                  {/* Top Bar: Book / Source Title & Actions */}
                  <div className="flex items-center justify-between border-b border-[#EAE5DA] pb-4 mb-5">
                    <div className="flex items-center gap-2 min-w-0">
                      <BookOpen className="w-4 h-4 text-[#3D5A80] shrink-0" />
                      <span className="font-serif font-bold text-sm text-[#111827] truncate">
                        {note.source_title || 'Untitled Document'}
                      </span>
                      {note.location && (
                        <span className="text-[10px] font-mono text-[#8C7A6B] bg-[#EFECE6] px-2 py-0.5 rounded shrink-0">
                          {isNaN(Number(note.location)) ? 'Bookmark' : `Page ${note.location}`}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[10px] font-mono text-[#8C7A6B]">
                        {dateStr}
                      </span>
                      <button 
                        onClick={() => handleDelete(note.id)}
                        className="text-[#9CA3AF] hover:text-red-600 transition-colors p-1 rounded-lg hover:bg-red-50 cursor-pointer"
                        title="Delete Note"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Highlighted Quote Excerpt */}
                  <div className="relative pl-5 border-l-2 border-[#C2410C] my-4">
                    <blockquote className="font-serif text-base md:text-lg text-[#1E293B] leading-relaxed italic">
                      &ldquo;{note.highlighted_text}&rdquo;
                    </blockquote>
                  </div>

                  {/* User Note / Reflection Section */}
                  <div className="mt-5 pt-4 border-t border-[#EAE5DA]">
                    {isEditing ? (
                      <div className="space-y-3">
                        <textarea
                          rows={3}
                          value={editingNoteText}
                          onChange={(e) => setEditingNoteText(e.target.value)}
                          placeholder="Write your thoughts or reflections..."
                          autoFocus
                          className="w-full p-3 bg-white border border-[#E7E2D6] rounded-xl text-xs md:text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#3D5A80] font-serif"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingNoteId(null)}
                            className="px-3 py-1.5 text-xs text-[#8C7A6B] hover:text-[#111827] cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit(note.id)}
                            disabled={isSavingEdit}
                            className="px-4 py-1.5 bg-[#1E293B] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            {isSavingEdit && <Loader2 className="w-3 h-3 animate-spin" />}
                            Save Note
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-2 flex-1">
                          <MessageSquare className="w-3.5 h-3.5 text-[#8C7A6B] mt-0.5 shrink-0" />
                          {note.note ? (
                            <p className="font-serif text-sm text-[#475569] leading-relaxed">
                              {note.note}
                            </p>
                          ) : (
                            <p className="font-serif text-xs text-[#9CA3AF] italic">
                              No written commentary attached yet.
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => handleStartEdit(note)}
                          className="text-xs font-mono text-[#8C7A6B] hover:text-[#111827] flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>{note.note ? 'Edit Note' : 'Add Note'}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Bottom Action: Jump into Book */}
                  {note.book_id && (
                    <div className="mt-5 pt-3 border-t border-[#EAE5DA] flex justify-end">
                      <Link
                        href={`/reader?id=${note.book_id}&loc=${encodeURIComponent(note.location || '')}&highlight=${encodeURIComponent(note.highlighted_text.slice(0, 50))}&from=notes`}
                        className="inline-flex items-center gap-1 text-xs font-mono font-bold text-[#3D5A80] hover:text-[#1E293B] transition-colors"
                      >
                        <span>Jump to Location in Book</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
