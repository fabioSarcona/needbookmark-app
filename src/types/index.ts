export interface Bookmark {
  id: string;
  url: string;
  title: string;
  description: string;
  image: string;
  favicon: string;
  domain: string;
  createdAt: string;
  isFavorite?: boolean;
  userId: string;
}
