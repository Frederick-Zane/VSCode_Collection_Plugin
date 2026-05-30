import * as vscode from 'vscode';

export async function pathExists(uri: vscode.Uri): Promise<boolean> {
  try {
    await vscode.workspace.fs.stat(uri);
    return true;
  } catch {
    return false;
  }
}

export async function openFileInActiveEditorGroup(uri: vscode.Uri): Promise<void> {
  const doc = await vscode.workspace.openTextDocument(uri);

  await vscode.window.showTextDocument(doc, {
    viewColumn: vscode.ViewColumn.Active,
    preview: false
  });
}

export async function pickAndOpenFileFromFolder(folderUri: vscode.Uri): Promise<void> {
  let entries: [string, vscode.FileType][];

  try {
    entries = await vscode.workspace.fs.readDirectory(folderUri);
  } catch {
    vscode.window.showErrorMessage('Failed to read the folder.');
    return;
  }

  const files = entries
    .filter(([, type]) => type === vscode.FileType.File)
    .map(([name]) => {
      const uri = vscode.Uri.joinPath(folderUri, name);
      return {
        label: name,
        description: uri.fsPath || uri.toString(),
        uri
      };
    });

  if (files.length === 0) {
    vscode.window.showInformationMessage('This folder does not contain any files to open.');
    return;
  }

  const selected = await vscode.window.showQuickPick(files, {
    placeHolder: 'Select a file to open',
    matchOnDescription: true
  });

  if (!selected) {
    return;
  }

  await openFileInActiveEditorGroup(selected.uri);
}
