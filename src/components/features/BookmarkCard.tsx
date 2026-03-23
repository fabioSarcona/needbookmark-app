import React from "react";
import { Bookmark } from "@/src/types";
import { Trash2, ExternalLink, Star, Pencil } from "lucide-react";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { motion } from "motion/react";
import { cn } from "@/src/lib/utils";

interface BookmarkCardProps {
  key?: string;
  bookmark: Bookmark;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
  onEdit: (bookmark: Bookmark) => void;
  isSelected: boolean;
  onSelect: (id: string, selected: boolean) => void;
  viewMode: 'grid' | 'list';
}

export function BookmarkCard({ 
  bookmark, 
  onDelete, 
  onToggleFavorite,
  onEdit,
  isSelected,
  onSelect,
  viewMode 
}: BookmarkCardProps) {
  
  if (viewMode === 'list') {
    return (
      <motion.div 
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={cn(
          "group relative flex items-center gap-4 overflow-hidden rounded-xl border bg-zinc-950/50 p-3 shadow-sm transition-all duration-300 hover:bg-zinc-900/50 backdrop-blur-sm",
          isSelected ? "border-white/40 ring-1 ring-white/20" : "border-white/10 hover:border-white/20"
        )}
      >
        <div className="flex items-center gap-3 pl-1">
          <Checkbox 
            checked={isSelected}
            onChange={(e) => onSelect(bookmark.id, e.target.checked)}
            className="opacity-0 group-hover:opacity-100 transition-opacity data-[state=checked]:opacity-100"
            style={{ opacity: isSelected ? 1 : undefined }}
          />
          <button 
            onClick={(e) => {
              e.preventDefault();
              onToggleFavorite(bookmark.id, !bookmark.isFavorite);
            }}
            className="text-zinc-500 hover:text-yellow-500 transition-colors"
          >
            <Star className={cn("h-5 w-5", bookmark.isFavorite && "fill-yellow-500 text-yellow-500")} />
          </button>
        </div>

        <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="flex flex-1 items-center gap-4 min-w-0">
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-zinc-900 border border-white/5">
            {bookmark.image ? (
              <img 
                src={bookmark.image} 
                alt={bookmark.title} 
                className="h-full w-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.classList.add('bg-gradient-to-br', 'from-zinc-800', 'to-zinc-950');
                }}
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-zinc-800 to-zinc-950" />
            )}
          </div>
          
          <div className="flex flex-1 flex-col min-w-0">
            <h3 className="truncate text-base font-medium text-zinc-100">
              {bookmark.title}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              {bookmark.favicon ? (
                <img src={bookmark.favicon} alt="" className="h-3 w-3 shrink-0 rounded-sm opacity-80" referrerPolicy="no-referrer" />
              ) : (
                <ExternalLink className="h-3 w-3 shrink-0 text-zinc-500" />
              )}
              <span className="truncate text-xs font-medium text-zinc-400">
                {bookmark.domain}
              </span>
              {bookmark.tags && bookmark.tags.length > 0 && (
                <>
                  <span className="text-zinc-600 text-xs">•</span>
                  <div className="flex items-center gap-1 overflow-hidden">
                    {bookmark.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="truncate rounded-md bg-zinc-800/80 px-1.5 py-0.5 text-[10px] font-medium text-zinc-300 border border-white/5">
                        #{tag}
                      </span>
                    ))}
                    {bookmark.tags.length > 3 && (
                      <span className="text-[10px] text-zinc-500">+{bookmark.tags.length - 3}</span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </a>
        
        <div className="flex items-center gap-2 pr-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-zinc-500 opacity-0 transition-opacity hover:text-blue-400 hover:bg-blue-500/10 group-hover:opacity-100"
            onClick={(e) => {
              e.preventDefault();
              onEdit(bookmark);
            }}
            title="Edit bookmark"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-zinc-500 opacity-0 transition-opacity hover:text-red-400 hover:bg-red-500/10 group-hover:opacity-100"
            onClick={(e) => {
              e.preventDefault();
              onDelete(bookmark.id);
            }}
            title="Delete bookmark"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    );
  }

  // Grid View
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border bg-zinc-950/40 shadow-sm transition-all duration-300 hover:bg-zinc-900/40 backdrop-blur-md",
        isSelected ? "border-white/40 ring-1 ring-white/20" : "border-white/10 hover:border-white/20"
      )}
    >
      <div className="absolute left-3 top-3 z-10 flex items-center gap-2">
        <Checkbox 
          checked={isSelected}
          onChange={(e) => onSelect(bookmark.id, e.target.checked)}
          className="bg-black/50 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ opacity: isSelected ? 1 : undefined }}
        />
      </div>
      
      <div className="absolute right-3 top-3 z-10">
        <button 
          onClick={(e) => {
            e.preventDefault();
            onToggleFavorite(bookmark.id, !bookmark.isFavorite);
          }}
          className="rounded-full bg-black/50 p-1.5 backdrop-blur-md text-zinc-400 hover:text-yellow-500 transition-colors shadow-sm opacity-0 group-hover:opacity-100 border border-white/10"
          style={{ opacity: bookmark.isFavorite ? 1 : undefined }}
        >
          <Star className={cn("h-4 w-4", bookmark.isFavorite && "fill-yellow-500 text-yellow-500")} />
        </button>
      </div>

      <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="flex-1 flex flex-col">
        <div className="aspect-[1.91/1] w-full overflow-hidden bg-zinc-900 border-b border-white/5">
          {bookmark.image ? (
            <img 
              src={bookmark.image} 
              alt={bookmark.title} 
              className="h-full w-full object-cover opacity-80 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).parentElement!.classList.add('bg-gradient-to-br', 'from-zinc-800', 'to-zinc-950');
              }}
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-zinc-800 to-zinc-950" />
          )}
        </div>
        <div className="flex flex-1 flex-col p-4">
          <h3 className="line-clamp-2 text-sm font-medium leading-tight text-zinc-100 group-hover:text-white transition-colors">
            {bookmark.title}
          </h3>
          <p className="mt-2 line-clamp-2 text-xs text-zinc-500">
            {bookmark.description || "No description available."}
          </p>
          {bookmark.tags && bookmark.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5 overflow-hidden">
              {bookmark.tags.slice(0, 3).map(tag => (
                <span key={tag} className="truncate rounded-md bg-zinc-800/80 px-1.5 py-0.5 text-[10px] font-medium text-zinc-300 border border-white/5">
                  #{tag}
                </span>
              ))}
              {bookmark.tags.length > 3 && (
                <span className="text-[10px] text-zinc-500">+{bookmark.tags.length - 3}</span>
              )}
            </div>
          )}
        </div>
      </a>
      
      <div className="flex items-center justify-between border-t border-white/5 bg-white/[0.02] px-4 py-3">
        <div className="flex items-center gap-2 overflow-hidden">
          {bookmark.favicon ? (
            <img src={bookmark.favicon} alt="" className="h-4 w-4 shrink-0 rounded-sm opacity-80" referrerPolicy="no-referrer" />
          ) : (
             <ExternalLink className="h-4 w-4 shrink-0 text-zinc-500" />
          )}
          <span className="truncate text-xs font-medium text-zinc-400">
            {bookmark.domain}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-zinc-500 opacity-0 transition-opacity hover:text-blue-400 hover:bg-blue-500/10 group-hover:opacity-100"
            onClick={(e) => {
              e.preventDefault();
              onEdit(bookmark);
            }}
            title="Edit bookmark"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-zinc-500 opacity-0 transition-opacity hover:text-red-400 hover:bg-red-500/10 group-hover:opacity-100"
            onClick={(e) => {
              e.preventDefault();
              onDelete(bookmark.id);
            }}
            title="Delete bookmark"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
