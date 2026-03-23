export const PREDEFINED_TAGS = [
  "AI tool",
  "NeedAgent AI",
  "Shortcode"
];

const TAG_COLORS: Record<string, string> = {
  "AI tool": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "NeedAgent AI": "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "Shortcode": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const FALLBACK_COLORS = [
  "bg-pink-500/10 text-pink-400 border-pink-500/20",
  "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "bg-rose-500/10 text-rose-400 border-rose-500/20",
  "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
];

export function getTagColor(tag: string) {
  if (TAG_COLORS[tag]) {
    return TAG_COLORS[tag];
  }
  
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % FALLBACK_COLORS.length;
  return FALLBACK_COLORS[index];
}
