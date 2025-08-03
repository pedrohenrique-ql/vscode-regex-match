import { TextEncoder } from 'util';
import { Position, Uri, ViewColumn, window, workspace } from 'vscode';

export const DEFAULT_FILE_CONTENT = '/[0-9]+a+/gm\n---\n123aaa\nb2507ab\n2024aa\n---';

class FileCreator {
  static async openRegexTestFile(fileUri: Uri, codeRegex?: string) {
    try {
      await workspace.fs.stat(fileUri);
    } catch (_error) {
      console.error('File not found, creating default test file.');
      await this.writeTestFile(fileUri, DEFAULT_FILE_CONTENT);
    } finally {
      let editor = window.visibleTextEditors.find((editor) => editor.document.uri.toString() === fileUri.toString());
      const fileContentWithCodeRegex = `${codeRegex}\n---\nType the test string here...\n---`;

      if (!editor) {
        const document = await workspace.openTextDocument(fileUri);
        editor = await window.showTextDocument(document, ViewColumn.Two, false);
      } else {
        await window.showTextDocument(editor.document, ViewColumn.Two, false);
      }

      if (codeRegex) {
        await editor.edit((editBuilder) => {
          const lastLine = editor.document.lineCount;
          const lastChar = editor.document.lineAt(lastLine - 1).range.end.character;
          const position = new Position(lastLine, lastChar);

          editBuilder.insert(position, `\n\n${fileContentWithCodeRegex}`);
        });

        const document = editor.document;
        await document.save();
      }

      return editor.document;
    }
  }

  static async writeDefaultTestFile(fileUri: Uri) {
    await workspace.fs.writeFile(fileUri, new TextEncoder().encode(DEFAULT_FILE_CONTENT));
  }

  static async writeTestFile(fileUri: Uri, content: string) {
    await workspace.fs.writeFile(fileUri, new TextEncoder().encode(content));
  }
}

export default FileCreator;
