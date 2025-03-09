import assert from 'assert';
import { after, beforeEach, describe, it } from 'mocha';
import { Range, Selection, ViewColumn, commands, window } from 'vscode';

import { CodeRegex } from '@/providers/code-lenses/TestRegexCodeLensProvider';
import { DEFAULT_FILE_CONTENT } from '@/services/regex-match/FileCreator';
import { REGEX_TEST_FILE_PATH } from '@/services/regex-match/RegexMatchService';

import snippets from '../../../snippets/snippets.json';
import { createTemporaryFile, wait, writeDefaultTestFile } from './utils';

describe('Regex Match Window', () => {
  beforeEach(async () => {
    await writeDefaultTestFile();
    await commands.executeCommand('workbench.action.closeAllEditors');
  });

  after(async () => {
    await writeDefaultTestFile();
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
    const documentUri = createTemporaryFile('Hello, world!');

    const pattern = /^\d{2}\w{3}/;
    const codeRegex: CodeRegex = { pattern: `${pattern}`, range: new Range(0, 0, 0, 0), documentUri };
    await commands.executeCommand('regex-match.openRegexMatchWindow', codeRegex);
    await wait(100);

    const activeTextEditor = window.activeTextEditor;

    assert.notStrictEqual(activeTextEditor, undefined);
    assert.equal(activeTextEditor!.viewColumn, ViewColumn.Two);
    const realEndPath = activeTextEditor!.document.fileName.replace(/[/\\]/g, '');
    const expectedEndPath = REGEX_TEST_FILE_PATH.replace(/\//g, '');
    assert.ok(realEndPath.endsWith(expectedEndPath));

    const expectedContent = `${DEFAULT_FILE_CONTENT}\n\n${codeRegex.pattern}\n---\nType the test string here...\n---`;
    assert.equal(activeTextEditor!.document.getText(), expectedContent);
  });

  it('should insert a regex test block using the snippet', async () => {
    await commands.executeCommand('regex-match.openRegexMatchWindow');
    const activeTextEditor = window.activeTextEditor;

    assert.notStrictEqual(activeTextEditor, undefined);

    const lastLine = activeTextEditor!.document.lineCount - 1;
    const lastLineLength = activeTextEditor!.document.lineAt(lastLine).text.length;

    activeTextEditor!.selection = new Selection(lastLine, lastLineLength, lastLine, lastLineLength);

    await commands.executeCommand('editor.action.insertLineAfter');
    await commands.executeCommand('editor.action.insertSnippet', { name: 'Regex Test Block' });
    await wait(100);

    const snippetBody = snippets['Regex Test Block'].body.join('\n').replace(/\${\d:|}/g, '');

    const expectedContent = `${DEFAULT_FILE_CONTENT}\n${snippetBody}`;
    assert.equal(activeTextEditor!.document.getText(), expectedContent);
  });
});
