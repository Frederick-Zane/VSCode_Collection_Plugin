import * as vscode from 'vscode';
import { FavoriteStorage } from './FavoriteStorage';
import { FavoriteItem } from './types';

type FavoriteActionId = 'addCurrentFile' | 'addFile' | 'addFolder' | 'refresh';

interface FavoriteAction {
  kind: 'action';
  id: FavoriteActionId;
  label: string;
  command: string;
  icon: vscode.ThemeIcon;
}

interface FileSystemEntry {
  kind: 'fsEntry';
  label: string;
  uri: string;
  type: 'file' | 'folder';
}

type FavoriteTreeEntry = FavoriteAction | FavoriteItem | FileSystemEntry;

const ACTIONS: FavoriteAction[] = [
  {
    kind: 'action',
    id: 'addCurrentFile',
    label: 'Add Current File',
    command: 'favoriteFileLauncher.addCurrentFile',
    icon: new vscode.ThemeIcon('add')
  },
  {
    kind: 'action',
    id: 'addFile',
    label: 'Add Files',
    command: 'favoriteFileLauncher.addFile',
    icon: new vscode.ThemeIcon('file')
  },
  {
    kind: 'action',
    id: 'addFolder',
    label: 'Add Folders',
    command: 'favoriteFileLauncher.addFolder',
    icon: new vscode.ThemeIcon('folder')
  },
  {
    kind: 'action',
    id: 'refresh',
    label: 'Refresh',
    command: 'favoriteFileLauncher.refresh',
    icon: new vscode.ThemeIcon('refresh')
  }
];

export class FavoriteTreeProvider implements vscode.TreeDataProvider<FavoriteTreeEntry> {
  private readonly onDidChangeTreeDataEmitter = new vscode.EventEmitter<FavoriteTreeEntry | undefined | void>();

  readonly onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;

  constructor(private readonly storage: FavoriteStorage) {}

  refresh(): void {
    this.onDidChangeTreeDataEmitter.fire();
  }

  getTreeItem(element: FavoriteTreeEntry): vscode.TreeItem {
    if (isAction(element)) {
      const treeItem = new vscode.TreeItem(element.label, vscode.TreeItemCollapsibleState.None);

      treeItem.iconPath = element.icon;
      treeItem.tooltip = element.label;
      treeItem.contextValue = 'favoriteFileLauncher.action';
      treeItem.command = {
        command: element.command,
        title: element.label
      };

      return treeItem;
    }

    const uri = vscode.Uri.parse(element.uri);
    const isFolder = element.type === 'folder';
    const label = isFolder ? `${element.label}/` : element.label;
    const collapsibleState = isFolder
      ? vscode.TreeItemCollapsibleState.Collapsed
      : vscode.TreeItemCollapsibleState.None;
    const treeItem = new vscode.TreeItem(label, collapsibleState);

    treeItem.iconPath = isFolder ? vscode.ThemeIcon.Folder : vscode.ThemeIcon.File;
    treeItem.tooltip = uri.fsPath || uri.toString();
    treeItem.contextValue = isFileSystemEntry(element)
      ? `favoriteFileLauncher.child.${element.type}`
      : `favoriteFileLauncher.${element.type}`;

    if (!isFolder) {
      treeItem.command = {
        command: 'favoriteFileLauncher.openItem',
        title: 'Open',
        arguments: [element]
      };
    }

    return treeItem;
  }

  async getChildren(element?: FavoriteTreeEntry): Promise<FavoriteTreeEntry[]> {
    if (!element) {
      return [...ACTIONS, ...this.storage.getItems()];
    }

    if (isAction(element) || isFile(element)) {
      return [];
    }

    if (isFolder(element)) {
      return this.getFolderChildren(vscode.Uri.parse(element.uri));
    }

    return [];
  }

  private async getFolderChildren(folderUri: vscode.Uri): Promise<FileSystemEntry[]> {
    try {
      const entries = await vscode.workspace.fs.readDirectory(folderUri);

      return entries
        .filter(([, type]) => type === vscode.FileType.File || type === vscode.FileType.Directory)
        .sort(([nameA, typeA], [nameB, typeB]) => {
          if (typeA !== typeB) {
            return typeA === vscode.FileType.Directory ? -1 : 1;
          }

          return nameA.localeCompare(nameB);
        })
        .map(([name, type]) => {
          const uri = vscode.Uri.joinPath(folderUri, name);
          return {
            kind: 'fsEntry',
            label: name,
            uri: uri.toString(),
            type: type === vscode.FileType.Directory ? 'folder' : 'file'
          };
        });
    } catch {
      vscode.window.showErrorMessage('Failed to read the folder.');
      return Promise.resolve([]);
    }
  }
}

function isAction(entry: FavoriteTreeEntry): entry is FavoriteAction {
  return 'kind' in entry && entry.kind === 'action';
}

function isFileSystemEntry(entry: FavoriteTreeEntry): entry is FileSystemEntry {
  return 'kind' in entry && entry.kind === 'fsEntry';
}

function isFile(entry: FavoriteTreeEntry): boolean {
  return 'type' in entry && entry.type === 'file';
}

function isFolder(entry: FavoriteTreeEntry): boolean {
  return 'type' in entry && entry.type === 'folder';
}
