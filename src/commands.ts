import * as vscode from 'vscode';
import { FavoriteStorage } from './FavoriteStorage';
import { FavoriteTreeProvider } from './FavoriteTreeProvider';
import { FavoriteItem, FavoriteItemType } from './types';
import { openFileInActiveEditorGroup, pathExists, pickAndOpenFileFromFolder } from './utils';

interface OpenableItem {
  id?: string;
  type: FavoriteItemType;
  label: string;
  uri: string;
}

export function registerCommands(
  context: vscode.ExtensionContext,
  storage: FavoriteStorage,
  treeProvider: FavoriteTreeProvider
): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('favoriteFileLauncher.addFile', async () => {
      const uris = await vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: true
      });

      if (!uris) {
        return;
      }

      await addUris(storage, treeProvider, uris, 'file');
    }),
    vscode.commands.registerCommand('favoriteFileLauncher.addCurrentFile', async () => {
      const editor = vscode.window.activeTextEditor;

      if (!editor) {
        vscode.window.showInformationMessage('No file is currently open.');
        return;
      }

      const uri = editor.document.uri;

      if (uri.scheme !== 'file') {
        vscode.window.showInformationMessage('The current file is not a local file.');
        return;
      }

      await addUris(storage, treeProvider, [uri], 'file');
    }),
    vscode.commands.registerCommand('favoriteFileLauncher.addFolder', async () => {
      const uris = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: true
      });

      if (!uris) {
        return;
      }

      await addUris(storage, treeProvider, uris, 'folder');
    }),
    vscode.commands.registerCommand('favoriteFileLauncher.openItem', async (item: OpenableItem) => {
      await openItem(item, storage, treeProvider);
    }),
    vscode.commands.registerCommand('favoriteFileLauncher.removeItem', async (item: FavoriteItem) => {
      if (!item) {
        return;
      }

      const confirmation = await vscode.window.showWarningMessage('Remove this item from favorites?', { modal: true }, 'Remove');

      if (confirmation !== 'Remove') {
        return;
      }

      await storage.removeItem(item.id);
      treeProvider.refresh();
    }),
    vscode.commands.registerCommand('favoriteFileLauncher.refresh', () => {
      treeProvider.refresh();
    })
  );
}

async function addUris(
  storage: FavoriteStorage,
  treeProvider: FavoriteTreeProvider,
  uris: vscode.Uri[],
  type: FavoriteItemType
): Promise<void> {
  const items = uris.map((uri) => createFavoriteItem(uri, type));
  const addedCount = await storage.addItems(items);

  if (addedCount === 0) {
    vscode.window.showInformationMessage('This item already exists.');
    return;
  }

  if (addedCount < items.length) {
    vscode.window.showInformationMessage('Duplicate items were skipped.');
  }

  treeProvider.refresh();
}

function createFavoriteItem(uri: vscode.Uri, type: FavoriteItemType): FavoriteItem {
  return {
    id: `${Date.now().toString()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    label: getUriLabel(uri),
    uri: uri.toString(),
    createdAt: Date.now()
  };
}

function getUriLabel(uri: vscode.Uri): string {
  const pathParts = uri.path.split('/').filter(Boolean);
  return pathParts[pathParts.length - 1] || uri.fsPath || uri.toString();
}

async function openItem(
  item: OpenableItem,
  storage: FavoriteStorage,
  treeProvider: FavoriteTreeProvider
): Promise<void> {
  const uri = vscode.Uri.parse(item.uri);

  if (!(await pathExists(uri))) {
    const answer = item.id
      ? await vscode.window.showErrorMessage('This path does not exist. It may have been deleted or moved.', 'Remove Favorite')
      : await vscode.window.showErrorMessage('This path does not exist. It may have been deleted or moved.');

    if (answer === 'Remove Favorite' && item.id) {
      await storage.removeItem(item.id);
      treeProvider.refresh();
    }

    return;
  }

  try {
    if (item.type === 'file') {
      await openFileInActiveEditorGroup(uri);
      return;
    }

    await pickAndOpenFileFromFolder(uri);
  } catch {
    vscode.window.showErrorMessage('Failed to open the file.');
  }
}
