import assert from 'assert';
import { after, beforeEach, describe, it } from 'mocha';
import { Range, ViewColumn, commands, window } from 'vscode';

import { CodeRegex } from '@/providers/code-lenses/TestRegexCodeLensProvider';
import { DEFAULT_FILE_CONTENT } from '@/services/regex-match/FileCreator';
import { REGEX_TEST_FILE_PATH } from '@/services/regex-match/RegexMatchService';

import { wait, writeDefaultTestFile } from './utils';

describe('Regex Match Window', () => {
  beforeEach(async () => {
    writeDefaultTestFile();
    await commands.executeCommand('workbench.action.closeAllEditors');
  });

  after(() => {
    writeDefaultTestFile();
  });

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

  it('should open the regex test window by command with correct content if a code regex is provided', async () => {
    const pattern = /^\d{2}\w{3}/;
    const codeRegex: CodeRegex = {
      pattern: `${pattern}`,
      range: new Range(0, 0, 0, 0),
      documentUri: window.activeTextEditor!.document.uri,
    };
    await commands.executeCommand('regex-match.openRegexMatchWindow', codeRegex);
    await wait(100);

    const activeTextEditor = window.activeTextEditor;

    assert.notStrictEqual(activeTextEditor, undefined);
    assert.equal(activeTextEditor!.viewColumn, ViewColumn.Two);
    const realEndPath = activeTextEditor!.document.fileName.replace(/[/\\]/g, '');
    const expectedEndPath = REGEX_TEST_FILE_PATH.replace(/\//g, '');
    assert.ok(realEndPath.endsWith(expectedEndPath));
    assert.equal(activeTextEditor!.document.getText(), '/^\\d{2}\\w{3}/\n---\nType the test string here...\n---');
  });
});
