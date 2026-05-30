import * as vscode from 'vscode';
import { FavoriteItem } from './types';

const STORAGE_KEY = 'favoriteFileLauncher.items';

export class FavoriteStorage {
  constructor(private readonly context: vscode.ExtensionContext) {}

  getItems(): FavoriteItem[] {
    return this.context.globalState.get<FavoriteItem[]>(STORAGE_KEY, []);
  }

  saveItems(items: FavoriteItem[]): Thenable<void> {
    return this.context.globalState.update(STORAGE_KEY, items);
  }

  async addItems(items: FavoriteItem[]): Promise<number> {
    const existingItems = this.getItems();
    const existingUris = new Set(existingItems.map((item) => item.uri));
    const newItems: FavoriteItem[] = [];

    for (const item of items) {
      if (existingUris.has(item.uri)) {
        continue;
      }

      existingUris.add(item.uri);
      newItems.push(item);
    }

    if (newItems.length === 0) {
      return 0;
    }

    await this.saveItems([...existingItems, ...newItems]);
    return newItems.length;
  }

  async removeItem(id: string): Promise<void> {
    const items = this.getItems().filter((item) => item.id !== id);
    await this.saveItems(items);
  }
}
