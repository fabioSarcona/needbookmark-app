/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from "react";
import { Bookmark as BookmarkIcon, LayoutGrid, List, Search, Trash2, X, LogOut, LogIn } from "lucide-react";
import { api } from "./lib/api";
import { AddBookmarkForm } from "./components/features/AddBookmarkForm";
import { BookmarkCard } from "./components/features/BookmarkCard";
import { motion, AnimatePresence } from "motion/react";
import { Input } from "./components/ui/input";
import { Button } from "./components/ui/button";
import { cn } from "./lib/utils";
import { Bookmark } from "./types";
import { getTagColor } from "./lib/tags";

// Firebase imports
import { User, onAuthStateChanged } from "firebase/auth";
import { collection, query, onSnapshot, doc, setDoc, deleteDoc, updateDoc, writeBatch } from "firebase/firestore";
import { initFirebase, auth, db, loginWithGoogle, logout } from "./lib/firebase";

type SortOption = 'date_desc' | 'date_asc' | 'title_asc' | 'title_desc' | 'domain_asc';

export default function App() {
  const [errorMsg, setErrorMsg] = useState("");
  
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [firebaseReady, setFirebaseReady] = useState(false);

  // Data State
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // UI State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('date_desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [columns, setColumns] = useState<number>(4);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Initialize Firebase
  useEffect(() => {
    initFirebase().then(() => setFirebaseReady(true));
  }, []);

  // Auth Listener
  useEffect(() => {
    if (!firebaseReady) return;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      if (!currentUser) {
        setBookmarks([]);
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, [firebaseReady]);

  // Firestore Listener
  useEffect(() => {
    if (!firebaseReady || !isAuthReady) return;
    if (!user) return;

    setIsLoading(true);
    const q = query(collection(db, `users/${user.uid}/bookmarks`));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedBookmarks: Bookmark[] = [];
      snapshot.forEach((doc) => {
        fetchedBookmarks.push(doc.data() as Bookmark);
      });
      setBookmarks(fetchedBookmarks);
      setIsLoading(false);
    }, (error) => {
      console.error('Firestore Error: ', error);
      setErrorMsg("Error loading bookmarks.");
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, isAuthReady]);

  const handleAddBookmark = async (url: string, tags: string[]) => {
    if (!user) {
      setErrorMsg("You must be logged in to add bookmarks.");
      return;
    }
    setIsAdding(true);
    setErrorMsg("");
    try {
      // Fetch metadata from our backend
      const metadata = await api.fetchMetadata(url);
      
      const newId = Date.now().toString();
      const newBookmark: Bookmark = {
        id: newId,
        url: metadata.url,
        title: metadata.title,
        description: metadata.description,
        image: metadata.image,
        favicon: metadata.favicon,
        domain: metadata.domain,
        createdAt: new Date().toISOString(),
        userId: user.uid,
        isFavorite: false,
        tags: tags
      };

      // Save to Firestore
      await setDoc(doc(db, `users/${user.uid}/bookmarks`, newId), newBookmark);
    } catch (error: any) {
      setErrorMsg(error.message || "Failed to add bookmark");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteBookmark = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/bookmarks`, id));
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (error) {
      console.error("Error deleting bookmark:", error);
    }
  };

  const handleToggleFavorite = async (id: string, isFavorite: boolean) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, `users/${user.uid}/bookmarks`, id), { isFavorite });
    } catch (error) {
      console.error("Error updating favorite:", error);
    }
  };

  const handleUpdateTags = async (id: string, tags: string[]) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, `users/${user.uid}/bookmarks`, id), { tags });
    } catch (error) {
      console.error("Error updating tags:", error);
    }
  };

  const handleBulkDelete = async () => {
    if (!user || selectedIds.size === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedIds.size} bookmarks?`)) {
      setIsDeleting(true);
      try {
        const batch = writeBatch(db);
        selectedIds.forEach(id => {
          const docRef = doc(db, `users/${user!.uid}/bookmarks`, id);
          batch.delete(docRef);
        });
        await batch.commit();
        setSelectedIds(new Set());
      } catch (error) {
        console.error("Error bulk deleting:", error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleSelect = (id: string, selected: boolean) => {
    const newSelected = new Set(selectedIds);
    if (selected) newSelected.add(id);
    else newSelected.delete(id);
    setSelectedIds(newSelected);
  };

  const { favoriteBookmarks, otherBookmarks, allTags } = useMemo(() => {
    const query = searchQuery.toLowerCase();
    let result = bookmarks.filter(b => 
      (b.title || "").toLowerCase().includes(query) ||
      (b.domain || "").toLowerCase().includes(query) ||
      (b.description || "").toLowerCase().includes(query)
    );

    if (selectedTagFilter) {
      result = result.filter(b => b.tags?.includes(selectedTagFilter));
    }

    result.sort((a, b) => {
      if (sortBy === 'date_desc') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'date_asc') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === 'title_asc') return a.title.localeCompare(b.title);
      if (sortBy === 'title_desc') return b.title.localeCompare(a.title);
      if (sortBy === 'domain_asc') return a.domain.localeCompare(b.domain);
      return 0;
    });

    const favorites = result.filter(b => b.isFavorite);
    const others = result.filter(b => !b.isFavorite);

    // Extract all unique tags
    const tagsSet = new Set<string>();
    bookmarks.forEach(b => {
      if (b.tags) {
        b.tags.forEach(t => tagsSet.add(t));
      }
    });
    const tags = Array.from(tagsSet).sort();

    return { favoriteBookmarks: favorites, otherBookmarks: others, allTags: tags };
  }, [bookmarks, searchQuery, sortBy, selectedTagFilter]);

  if (!isAuthReady || !firebaseReady) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/10 border-t-white" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-black font-sans text-zinc-100 relative flex flex-col overflow-hidden">
      {/* Background Glow Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]"></div>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .dynamic-grid {
            display: grid;
            grid-template-columns: repeat(${columns}, minmax(0, 1fr));
          }
        }
        @media (min-width: 640px) and (max-width: 1023px) {
          .dynamic-grid {
            display: grid;
            grid-template-columns: repeat(${Math.min(columns, 3)}, minmax(0, 1fr));
          }
        }
        @media (max-width: 639px) {
          .dynamic-grid {
            display: grid;
            grid-template-columns: repeat(1, minmax(0, 1fr));
          }
        }
      `}</style>

      {/* Header */}
      <header className="shrink-0 z-30 border-b border-white/10 bg-black/50 px-6 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M4 4v16a2 2 0 0 0 3 1.5l5-2.5 5 2.5A2 2 0 0 0 20 20V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2z"/></svg>
            </div>
            <h1 className="text-xl font-semibold tracking-tight hidden sm:block text-white">NeedBookmark</h1>
          </div>
          
          {/* Search & Filters */}
          <div className="flex flex-1 items-center justify-end gap-3 ml-6">
            {user && (
              <>
                <div className="relative max-w-md w-full hidden md:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <Input 
                    placeholder="Search by title or domain..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-white/5 border-white/10 focus-visible:ring-white/20 text-white placeholder:text-zinc-500"
                  />
                </div>
                
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="h-9 rounded-md border border-white/10 bg-zinc-900 px-3 py-1 text-sm text-zinc-300 shadow-sm focus:outline-none focus:ring-1 focus:ring-white/30"
                >
                  <option value="date_desc">Newest</option>
                  <option value="date_asc">Oldest</option>
                  <option value="title_asc">Title (A-Z)</option>
                  <option value="title_desc">Title (Z-A)</option>
                  <option value="domain_asc">Domain</option>
                </select>

                <div className="flex items-center rounded-md border border-white/10 bg-zinc-900/50 p-1 shadow-sm">
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={cn("p-1.5 rounded-sm transition-colors", viewMode === 'grid' ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300")}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={cn("p-1.5 rounded-sm transition-colors", viewMode === 'list' ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300")}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>

                {viewMode === 'grid' && (
                  <select 
                    value={columns} 
                    onChange={(e) => setColumns(Number(e.target.value))}
                    className="h-9 rounded-md border border-white/10 bg-zinc-900 px-2 py-1 text-sm text-zinc-300 shadow-sm focus:outline-none focus:ring-1 focus:ring-white/30 hidden lg:block"
                    title="Columns"
                  >
                    {[...Array(10)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1} Col</option>
                    ))}
                  </select>
                )}
              </>
            )}

            {/* Auth Button */}
            <div className="ml-2 pl-4 border-l border-white/10">
              {user ? (
                <Button variant="ghost" size="sm" onClick={logout} className="text-zinc-400 hover:text-white">
                  <LogOut className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              ) : (
                <Button variant="default" size="sm" onClick={loginWithGoogle} className="bg-white text-black hover:bg-zinc-200">
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto w-full relative z-10">
        <div className="mx-auto max-w-[1600px] px-6 py-16">
          {/* Hero Section */}
          <div className="mb-16 flex flex-col items-center text-center">
          <h2 className="mb-6 text-4xl font-semibold tracking-tight text-white sm:text-6xl">
            Organize your digital <br />
            <span className="text-zinc-500">workspace with ease.</span>
          </h2>
          <p className="mb-10 max-w-2xl text-lg text-zinc-400">
            Save websites, articles, and apps you use frequently. We'll turn them into visual shortcuts for quick, distraction-free access.
          </p>
          
          {user ? (
            <AddBookmarkForm 
              onAdd={handleAddBookmark} 
              isLoading={isAdding} 
            />
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 max-w-md w-full backdrop-blur-sm">
              <h3 className="text-lg font-medium text-white mb-2">Sign in to save bookmarks</h3>
              <p className="text-sm text-zinc-400 mb-4">Your bookmarks will be securely synced across all your devices.</p>
              <Button onClick={loginWithGoogle} className="w-full bg-white text-black hover:bg-zinc-200">
                Continue with Google
              </Button>
            </div>
          )}
          
          {errorMsg && (
            <p className="mt-4 text-sm font-medium text-red-400">{errorMsg}</p>
          )}
        </div>

        {user && (
          <>
            {/* Mobile Search */}
            <div className="mb-8 md:hidden relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input 
                placeholder="Search by title or domain..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-zinc-900/50 border-white/10 text-white"
              />
            </div>

            {/* Bookmarks Grid/List */}
            {isLoading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/10 border-t-white" />
              </div>
            ) : (
              <div className="space-y-12">
                {/* Tag Filter */}
                {allTags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 max-w-4xl mx-auto lg:max-w-none">
                    <span className="text-sm text-zinc-500 mr-2">Filter by tag:</span>
                    <button
                      onClick={() => setSelectedTagFilter(null)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                        selectedTagFilter === null 
                          ? "bg-white text-black" 
                          : "bg-zinc-900/50 text-zinc-400 border border-white/10 hover:bg-zinc-800 hover:text-zinc-300"
                      )}
                    >
                      All
                    </button>
                    {allTags.map(tag => {
                      const colorClass = getTagColor(tag);
                      return (
                        <button
                          key={tag}
                          onClick={() => setSelectedTagFilter(tag === selectedTagFilter ? null : tag)}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                            selectedTagFilter === tag 
                              ? colorClass
                              : "bg-zinc-900/50 text-zinc-400 border-white/10 hover:bg-zinc-800 hover:text-zinc-300"
                          )}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                )}

                {(favoriteBookmarks.length > 0 || otherBookmarks.length > 0) ? (
                  <>
                    {favoriteBookmarks.length > 0 && (
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-yellow-500"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                          Favorites
                        </h3>
                        <motion.div 
                          layout
                          className={cn(
                            "gap-6",
                            viewMode === 'grid' ? "dynamic-grid" : "grid grid-cols-1 max-w-4xl mx-auto"
                          )}
                        >
                          <AnimatePresence mode="popLayout">
                            {favoriteBookmarks.map((bookmark) => (
                              <BookmarkCard 
                                key={bookmark.id} 
                                bookmark={bookmark} 
                                onDelete={handleDeleteBookmark} 
                                onToggleFavorite={handleToggleFavorite}
                                onUpdateTags={handleUpdateTags}
                                isSelected={selectedIds.has(bookmark.id)}
                                onSelect={handleSelect}
                                viewMode={viewMode}
                              />
                            ))}
                          </AnimatePresence>
                        </motion.div>
                      </div>
                    )}

                    {otherBookmarks.length > 0 && (
                      <div>
                        {favoriteBookmarks.length > 0 && (
                          <h3 className="text-xl font-semibold text-white mb-6">All Bookmarks</h3>
                        )}
                        <motion.div 
                          layout
                          className={cn(
                            "gap-6",
                            viewMode === 'grid' ? "dynamic-grid" : "grid grid-cols-1 max-w-4xl mx-auto"
                          )}
                        >
                          <AnimatePresence mode="popLayout">
                            {otherBookmarks.map((bookmark) => (
                              <BookmarkCard 
                                key={bookmark.id} 
                                bookmark={bookmark} 
                                onDelete={handleDeleteBookmark} 
                                onToggleFavorite={handleToggleFavorite}
                                onUpdateTags={handleUpdateTags}
                                isSelected={selectedIds.has(bookmark.id)}
                                onSelect={handleSelect}
                                viewMode={viewMode}
                              />
                            ))}
                          </AnimatePresence>
                        </motion.div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-24 text-center max-w-4xl mx-auto backdrop-blur-sm">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5 border border-white/10">
                      <BookmarkIcon className="h-8 w-8 text-zinc-500" />
                    </div>
                    <h3 className="text-lg font-medium text-white">
                      {searchQuery || selectedTagFilter ? "No results found" : "No bookmarks yet"}
                    </h3>
                    <p className="mt-2 max-w-sm text-sm text-zinc-400">
                      {searchQuery || selectedTagFilter
                        ? "Try adjusting your search terms or filters."
                        : "Start by adding your first link using the input bar above."}
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="shrink-0 border-t border-white/10 bg-black/50 backdrop-blur-md py-6 relative z-10">
        <div className="mx-auto max-w-[1600px] px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-zinc-500"><path d="M4 4v16a2 2 0 0 0 3 1.5l5-2.5 5 2.5A2 2 0 0 0 20 20V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2z"/></svg>
            <span className="text-sm text-zinc-500">NeedBookmark © 2026. All rights reserved.</span>
          </div>
          <div className="flex gap-6 text-sm text-zinc-500">
            <a href="#" className="hover:text-white transition-colors">Product</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
          </div>
        </div>
      </footer>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 rounded-full border border-white/10 bg-zinc-900/90 backdrop-blur-xl px-6 py-3 text-white shadow-2xl"
          >
            <span className="text-sm font-medium">{selectedIds.size} selected</span>
            <div className="h-4 w-px bg-white/20" />
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBulkDelete}
              className="text-red-400 hover:bg-red-500/20 hover:text-red-300 h-8"
              disabled={isDeleting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSelectedIds(new Set())}
              className="text-zinc-400 hover:bg-white/10 hover:text-white h-8 w-8 rounded-full ml-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
