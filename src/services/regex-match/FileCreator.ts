import { TextEncoder } from 'util';
import { Range, Uri, ViewColumn, window, workspace } from 'vscode';

export const DEFAULT_FILE_CONTENT = '/[0-9]+a+/gm\n---\n123aaa\nb2507ab\n2024aa\n---';

class FileCreator {
  static async openRegexTestFile(fileUri: Uri, codeRegex?: string) {
    try {
      await workspace.fs.stat(fileUri);
    } catch (_error) {
      console.error('File not found, creating default test file.');
      await this.writeTestFile(fileUri, DEFAULT_FILE_CONTENT);
    } finally {
      const editor = window.visibleTextEditors.find((editor) => editor.document.uri.toString() === fileUri.toString());
      const fileContentWithCodeRegex = `${codeRegex}\n---\nType the test string here...\n---`;

      if (editor && codeRegex) {
        await editor.edit((editBuilder) => {
          editBuilder.replace(new Range(0, 0, editor.document.lineCount, 0), fileContentWithCodeRegex);
        });

        const document = editor.document;
        await document.save();
        await window.showTextDocument(document, ViewColumn.Two, false);

        return document;
      } else {
        if (codeRegex) {
          await this.writeTestFile(fileUri, fileContentWithCodeRegex);
        }

        const document = await workspace.openTextDocument(fileUri);
        await window.showTextDocument(document, ViewColumn.Two, false);

        return document;
      }
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
