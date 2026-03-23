import { Bookmark } from "../types";

export const api = {
  fetchMetadata: async (url: string): Promise<any> => {
    const res = await fetch('/api/metadata', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to fetch metadata');
    }
    return res.json();
  }
};
