import { TextEncoder } from 'util';
import { Uri, ViewColumn, window, workspace } from 'vscode';

const REGEX_TEST_FILE_PATH = '/regex-test-file/RegexMatch.rgx';
const DEFAULT_FILE_CONTENT = `/[0-9]+a+/g\n---\n123aaa\n---`;

class FileCreator {
  static async openRegexTestFile(extensionPath: string) {
    const fileUri = Uri.file(`${extensionPath}/${REGEX_TEST_FILE_PATH}`);

    try {
      await workspace.fs.stat(fileUri);
    } catch (_error) {
      console.log('File not found, creating default test file.');
      await this.writeDefaultTestFile(fileUri);
    } finally {
      const document = await workspace.openTextDocument(fileUri);
      await window.showTextDocument(document, ViewColumn.Two, false);

      return document;
    }
  }

  static async writeDefaultTestFile(fileUri: Uri) {
    await workspace.fs.writeFile(fileUri, new TextEncoder().encode(DEFAULT_FILE_CONTENT));
  }
}

export default FileCreator;
