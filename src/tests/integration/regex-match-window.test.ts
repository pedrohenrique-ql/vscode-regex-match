import assert from 'assert';
import { describe, it } from 'mocha';
import { ViewColumn, commands, window } from 'vscode';

import { DEFAULT_FILE_CONTENT } from '@/FileCreator';
import { REGEX_TEST_FILE_PATH } from '@/RegexMatchService';

describe('Regex Match Window', () => {
  it('should open the regex test window by command with correct content', async () => {
    await commands.executeCommand('regex-match.openRegexMatchWindow');
    const activeTextEditor = window.activeTextEditor;

    assert.notStrictEqual(activeTextEditor, undefined);

    assert.equal(activeTextEditor!.viewColumn, ViewColumn.Two);
    const realEndPath = activeTextEditor!.document.fileName.replace(/[/\\]/g, '');
    const expectedEndPath = REGEX_TEST_FILE_PATH.replace(/\//g, '');
    assert.ok(realEndPath.endsWith(expectedEndPath));
    assert.equal(activeTextEditor!.document.getText(), DEFAULT_FILE_CONTENT);
  });
});
