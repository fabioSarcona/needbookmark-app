import React, { useState } from "react";
import { Plus, Loader2, X } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

interface AddBookmarkFormProps {
  onAdd: (url: string, tags: string[]) => Promise<void>;
  isLoading: boolean;
  allTags?: string[];
}

export function AddBookmarkForm({ onAdd, isLoading, allTags = [] }: AddBookmarkFormProps) {
  const [url, setUrl] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [error, setError] = useState("");

  const suggestions = allTags
    .filter(t => t.toLowerCase().includes(tagInput.toLowerCase()) && !tags.includes(t))
    .slice(0, 5);

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (newTag && !tags.includes(newTag) && tags.length < 10) {
        setTags([...tags, newTag]);
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!url.trim()) return;
    
    try {
      // Basic validation before submitting
      new URL(url.startsWith('http') ? url : `https://${url}`);
      const finalUrl = url.startsWith('http') ? url : `https://${url}`;
      
      await onAdd(finalUrl, tags);
      setUrl("");
      setTags([]);
      setTagInput("");
    } catch (err) {
      setError("Please enter a valid URL (e.g. https://example.com)");
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
          className="relative h-14 rounded-full pl-6 pr-32 text-base bg-zinc-950/80 border-white/10 shadow-sm focus-visible:ring-white/30 backdrop-blur-sm"
          disabled={isLoading}
        />
        <Button 
          type="submit" 
          disabled={!url.trim() || isLoading}
          className="absolute right-2 h-10 rounded-full bg-white text-black px-6 hover:bg-zinc-200"
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
      
      <div className="flex flex-col gap-2 px-2">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Input
              type="text"
              placeholder="Add tags (press Enter)..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              className="h-9 bg-zinc-900/50 border-white/10 text-sm max-w-[200px]"
              disabled={isLoading || tags.length >= 10}
            />
            {tagInput && suggestions.length > 0 && (
              <div className="absolute z-10 w-full bg-zinc-800 border border-white/10 rounded-md mt-1 shadow-lg overflow-hidden">
                {suggestions.map(s => (
                  <button 
                    key={s} 
                    type="button"
                    onClick={() => { setTags([...tags, s]); setTagInput(''); }} 
                    className="block w-full text-left px-3 py-2 hover:bg-zinc-700 text-sm text-zinc-200"
                  >
                    #{s}
                  </button>
                ))}
              </div>
            )}
          </div>
          <span className="text-xs text-zinc-500">Optional: categorize your bookmark</span>
        </div>
        
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-1">
            {tags.map(tag => (
              <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-800 text-xs text-zinc-300 border border-white/5">
                #{tag}
                <button 
                  type="button" 
                  onClick={() => removeTag(tag)}
                  className="text-zinc-500 hover:text-zinc-300 focus:outline-none"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
      
      {error && <p className="mt-1 pl-4 text-sm text-red-400">{error}</p>}
    </form>
  );
}
