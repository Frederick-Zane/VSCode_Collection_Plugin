import * as vscode from 'vscode';
import { registerCommands } from './commands';
import { FavoriteStorage } from './FavoriteStorage';
import { FavoriteTreeProvider } from './FavoriteTreeProvider';

export function activate(context: vscode.ExtensionContext) {
  const storage = new FavoriteStorage(context);
  const treeProvider = new FavoriteTreeProvider(storage);

  const treeView = vscode.window.createTreeView('favoriteFileLauncherView', {
    treeDataProvider: treeProvider
  });

  context.subscriptions.push(treeView);
  registerCommands(context, storage, treeProvider);
}

export function deactivate() {}
