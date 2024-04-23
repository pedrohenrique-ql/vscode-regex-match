import assert from 'assert';
import { describe, it } from 'mocha';
import { ViewColumn, commands, window } from 'vscode';

import { DEFAULT_FILE_CONTENT } from '@/FileCreator';
import { REGEX_TEST_FILE_PATH } from '@/RegexMatchService';

describe('Regex Test Window', () => {
  it('should open the regex test window by command with correct content', async () => {
    await commands.executeCommand('regex-match.openRegexTestWindow');
    const activeTextEditor = window.activeTextEditor;

    assert.notStrictEqual(activeTextEditor, undefined);

    assert.equal(activeTextEditor!.viewColumn, ViewColumn.Two);
    assert.ok(activeTextEditor!.document.fileName.endsWith(REGEX_TEST_FILE_PATH));
    assert.equal(activeTextEditor!.document.getText(), DEFAULT_FILE_CONTENT);
  });
});
