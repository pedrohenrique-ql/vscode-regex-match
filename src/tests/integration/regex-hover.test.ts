import assert from 'assert';
import { before, describe, it } from 'mocha';
import { Hover, MarkdownString, Position, Range, Uri, commands, extensions, window, workspace } from 'vscode';

import { name, publisher } from '../../../package.json';
import { createTemporaryFile, wait } from './utils';

describe('Regex hover', () => {
  const regexLine = '/(\\d{2,4})\\w+/gi';
  const fileContent = `${regexLine}\n---\n1234abc\n---`;
  let documentUri: Uri;

  function hoverAt(documentUri: Uri, line: number, character: number): Thenable<Hover[]> {
    return commands.executeCommand<Hover[]>('vscode.executeHoverProvider', documentUri, new Position(line, character));
  }

  function hoverText(hover: Hover): string {
    return hover.contents.map((content) => (content as MarkdownString).value).join('\n\n');
  }

  before(async () => {
    await extensions.getExtension(`${publisher}.${name}`)!.activate();

    documentUri = createTemporaryFile(fileContent, 'hover-test-file.rgx');

    const document = await workspace.openTextDocument(documentUri);
    await window.showTextDocument(document);
    await wait(100);
  });

  it('should explain the hovered token and its enclosing tokens on the regex line', async () => {
    const hovers = await hoverAt(documentUri, 0, 2);

    assert.equal(hovers.length, 1);

    const text = hoverText(hovers[0]);
    assert.ok(text.includes('matches a digit'));
    assert.ok(text.includes('between 2 and 4 times'));
    assert.ok(text.includes('capturing group 1'));

    assert.ok(hovers[0].range!.isEqual(new Range(0, 2, 0, 4)));
  });

  it('should explain the hovered flag and the remaining flags', async () => {
    const hovers = await hoverAt(documentUri, 0, 15);

    assert.equal(hovers.length, 1);

    const text = hoverText(hovers[0]);
    assert.ok(text.includes('case-insensitive matching'));
    assert.ok(text.includes('global — finds all matches instead of stopping at the first'));

    assert.ok(hovers[0].range!.isEqual(new Range(0, 15, 0, 16)));
  });

  it('should not provide a hover for the test lines and the delimiters', async () => {
    assert.equal((await hoverAt(documentUri, 1, 1)).length, 0);
    assert.equal((await hoverAt(documentUri, 2, 1)).length, 0);
    assert.equal((await hoverAt(documentUri, 3, 1)).length, 0);
  });
});
