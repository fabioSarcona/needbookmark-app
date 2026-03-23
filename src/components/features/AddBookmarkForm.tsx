import React, { useState } from "react";
import { Plus, Loader2, Tag as TagIcon, X } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { PREDEFINED_TAGS, getTagColor } from "@/src/lib/tags";
import { cn } from "@/src/lib/utils";

interface AddBookmarkFormProps {
  onAdd: (url: string, tags: string[]) => Promise<void>;
  isLoading: boolean;
}

export function AddBookmarkForm({ onAdd, isLoading }: AddBookmarkFormProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [showTags, setShowTags] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!url.trim()) return;
    
    try {
      // Basic validation before submitting
      new URL(url.startsWith('http') ? url : `https://${url}`);
      const finalUrl = url.startsWith('http') ? url : `https://${url}`;
      
      await onAdd(finalUrl, selectedTags);
      setUrl("");
      setSelectedTags([]);
      setShowTags(false);
    } catch (err) {
      setError("Please enter a valid URL (e.g. https://example.com)");
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleAddCustomTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && customTag.trim()) {
      e.preventDefault();
      const newTag = customTag.trim();
      if (!selectedTags.includes(newTag)) {
        setSelectedTags(prev => [...prev, newTag]);
      }
      setCustomTag("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto flex flex-col gap-3">
      <div className="relative flex items-center group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-zinc-800 to-zinc-700 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
        <Input
          type="url"
          placeholder="Paste a link here (e.g. https://github.com)..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="relative h-14 rounded-full pl-6 pr-40 text-base bg-zinc-950/80 border-white/10 shadow-sm focus-visible:ring-white/30 backdrop-blur-sm"
          disabled={isLoading}
        />
        <div className="absolute right-2 flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShowTags(!showTags)}
            className={cn(
              "h-10 w-10 rounded-full transition-colors",
              showTags || selectedTags.length > 0 ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white hover:bg-white/5"
            )}
            title="Add tags"
          >
            <TagIcon className="h-4 w-4" />
          </Button>
          <Button 
            type="submit" 
            disabled={!url.trim() || isLoading}
            className="h-10 rounded-full bg-white text-black px-6 hover:bg-zinc-200"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add
              </>
            )}
          </Button>
        </div>
      </div>
      
      {showTags && (
        <div className="flex flex-col gap-3 p-4 rounded-2xl bg-zinc-900/50 border border-white/10 backdrop-blur-sm animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="flex flex-wrap gap-2">
            {PREDEFINED_TAGS.map(tag => {
              const isSelected = selectedTags.includes(tag);
              const colorClass = getTagColor(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                    isSelected 
                      ? colorClass
                      : "bg-zinc-800/50 text-zinc-400 border-white/5 hover:bg-zinc-800 hover:text-zinc-300"
                  )}
                >
                  {tag}
                </button>
              );
            })}
            
            {selectedTags.filter(t => !PREDEFINED_TAGS.includes(t)).map(tag => {
              const colorClass = getTagColor(tag);
              return (
                <span
                  key={tag}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1",
                    colorClass
                  )}
                >
                  {tag}
                  <button 
                    type="button" 
                    onClick={() => toggleTag(tag)}
                    className="hover:bg-black/20 rounded-full p-0.5 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              );
            })}
          </div>
          
          <Input
            type="text"
            placeholder="Type custom tag and press Enter..."
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            onKeyDown={handleAddCustomTag}
            className="h-9 bg-black/40 border-white/10 text-sm focus-visible:ring-white/20"
          />
        </div>
      )}

      {error && <p className="pl-4 text-sm text-red-400">{error}</p>}
    </form>
  );
}
