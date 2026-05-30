export type FavoriteItemType = 'file' | 'folder';

export interface FavoriteItem {
  id: string;
  type: FavoriteItemType;
  label: string;
  uri: string;
  createdAt: number;
}
