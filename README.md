# Favorite File Launcher

Favorite File Launcher adds a VS Code sidebar view for pinning frequently used files and folders.

## Features

- Pin one or more files.
- Pin one or more folders.
- Open pinned files in the active editor group.
- Expand pinned folders as a collapsible file tree.
- Open files from expanded folder trees in the active editor group.
- Remove pinned items from the sidebar.
- Persist pinned items with VS Code global state.

## Usage

Open the `Favorites` activity bar view, then use the action rows at the top of the `Favorite Files` tree to add the current file, add files, add folders, or refresh the list.

Click a pinned file to open it. Expand a pinned folder to browse its files and subfolders, then click a file to open it.

## Commands

- `favoriteFileLauncher.addFile`: Add Files
- `favoriteFileLauncher.addCurrentFile`: Add Current File
- `favoriteFileLauncher.addFolder`: Add Folders
- `favoriteFileLauncher.openItem`: Open Favorite
- `favoriteFileLauncher.removeItem`: Remove Favorite
- `favoriteFileLauncher.refresh`: Refresh Favorites

## MVP Limits

- Folder trees are loaded on demand when expanded.
- No Webview UI.
- No drag-and-drop sorting.
- No cloud sync.
- No workspace-specific favorites.

## Future Plans

- Workspace favorites.
- Custom display names.
- Reveal item in system file explorer.
- Extension settings for preview mode and folder scan behavior.
