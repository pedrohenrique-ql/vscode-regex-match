import { describe, it, expect, beforeAll } from 'vitest';
import * as vscodeTextmate from 'vscode-textmate';

import { createRegistry } from '../utils/loadGrammar';

describe('Regex Match Grammar', () => {
  let grammar: vscodeTextmate.IGrammar;

  beforeAll(async () => {
    const registry = await createRegistry();
    const loadedGrammar = await registry.loadGrammar('source.rgx');

    if (!loadedGrammar) {
      throw new Error('Grammar not found');
    }

    grammar = loadedGrammar;
  });

  function expectToken(
    token: vscodeTextmate.IToken,
    { startIndex, endIndex, scopes }: { startIndex: number; endIndex: number; scopes: string[] },
  ) {
    expect(token.scopes).toBeDefined();
    expect(token.scopes.length).toBeGreaterThan(0);
    expect(token.startIndex).toBe(startIndex);
    expect(token.endIndex).toBe(endIndex);
    expect(token.scopes).toEqual(scopes);
  }

  function expectTokenWithScopes(tokens: vscodeTextmate.IToken[], scopes: string[]) {
    const hasScopes = tokens.some((token) => scopes.every((scope) => token.scopes.includes(scope)));
    expect(hasScopes).toBe(true);
  }

  function expectNotTokenWithScopes(tokens: vscodeTextmate.IToken[], scopes: string[]) {
    const hasScopes = tokens.some((token) => scopes.every((scope) => token.scopes.includes(scope)));
    expect(hasScopes).toBe(false);
  }

  it('should tokenize simple regex', () => {
    const line = '/[a-z]+/gi';
    const { tokens } = grammar.tokenizeLine(line, vscodeTextmate.INITIAL);

    expectToken(tokens[0], {
      startIndex: 0,
      endIndex: 1,
      scopes: ['source.rgx', 'meta.regex-line.rgx', 'string.regexp.rgx', 'punctuation.definition.string.begin.rgx'],
    });
    expectToken(tokens[1], {
      startIndex: 1,
      endIndex: 2,
      scopes: [
        'source.rgx',
        'meta.regex-line.rgx',
        'string.regexp.rgx',
        'constant.other.character-class.set.regexp',
        'punctuation.definition.character-class.regexp',
      ],
    });
    expectToken(tokens[2], {
      startIndex: 2,
      endIndex: 5,
      scopes: ['source.rgx', 'meta.regex-line.rgx', 'string.regexp.rgx', 'constant.other.character-class.set.regexp'],
    });
    expectToken(tokens[3], {
      startIndex: 5,
      endIndex: 6,
      scopes: [
        'source.rgx',
        'meta.regex-line.rgx',
        'string.regexp.rgx',
        'constant.other.character-class.set.regexp',
        'punctuation.definition.character-class.regexp',
      ],
    });
    expectToken(tokens[4], {
      startIndex: 6,
      endIndex: 7,
      scopes: ['source.rgx', 'meta.regex-line.rgx', 'string.regexp.rgx', 'keyword.operator.quantifier.regexp'],
    });
    expectToken(tokens[5], {
      startIndex: 7,
      endIndex: 8,
      scopes: ['source.rgx', 'meta.regex-line.rgx', 'string.regexp.rgx', 'punctuation.definition.string.end.rgx'],
    });
    expectToken(tokens[6], {
      startIndex: 8,
      endIndex: 10,
      scopes: [
        'source.rgx',
        'meta.regex-line.rgx',
        'string.regexp.rgx',
        'punctuation.definition.string.end.rgx',
        'keyword.other.rgx',
      ],
    });
  });

  it('should tokenize quantifiers', () => {
    const line = '/a{2,4}?/';
    const { tokens } = grammar.tokenizeLine(line, vscodeTextmate.INITIAL);

    expectToken(tokens[0], {
      startIndex: 0,
      endIndex: 1,
      scopes: ['source.rgx', 'meta.regex-line.rgx', 'string.regexp.rgx', 'punctuation.definition.string.begin.rgx'],
    });
    expectToken(tokens[1], {
      startIndex: 1,
      endIndex: 2,
      scopes: ['source.rgx', 'meta.regex-line.rgx', 'string.regexp.rgx'],
    });
    expectToken(tokens[2], {
      startIndex: 2,
      endIndex: 8,
      scopes: ['source.rgx', 'meta.regex-line.rgx', 'string.regexp.rgx', 'keyword.operator.quantifier.regexp'],
    });
    expectToken(tokens[3], {
      startIndex: 8,
      endIndex: 9,
      scopes: ['source.rgx', 'meta.regex-line.rgx', 'string.regexp.rgx', 'punctuation.definition.string.end.rgx'],
    });
  });

  it('should tokenize named groups', () => {
    const line = '/(?<name>abc)/';
    const { tokens } = grammar.tokenizeLine(line, vscodeTextmate.INITIAL);

    expectToken(tokens[0], {
      startIndex: 0,
      endIndex: 1,
      scopes: ['source.rgx', 'meta.regex-line.rgx', 'string.regexp.rgx', 'punctuation.definition.string.begin.rgx'],
    });
    expectToken(tokens[1], {
      startIndex: 1,
      endIndex: 4,
      scopes: [
        'source.rgx',
        'meta.regex-line.rgx',
        'string.regexp.rgx',
        'meta.group.regexp',
        'punctuation.definition.group.regexp',
      ],
    });
    expectToken(tokens[2], {
      startIndex: 4,
      endIndex: 8,
      scopes: [
        'source.rgx',
        'meta.regex-line.rgx',
        'string.regexp.rgx',
        'meta.group.regexp',
        'punctuation.definition.group.regexp',
        'variable.other.regexp',
      ],
    });
    expectToken(tokens[3], {
      startIndex: 8,
      endIndex: 9,
      scopes: [
        'source.rgx',
        'meta.regex-line.rgx',
        'string.regexp.rgx',
        'meta.group.regexp',
        'punctuation.definition.group.regexp',
      ],
    });
    expectToken(tokens[4], {
      startIndex: 9,
      endIndex: 12,
      scopes: ['source.rgx', 'meta.regex-line.rgx', 'string.regexp.rgx', 'meta.group.regexp'],
    });
    expectToken(tokens[5], {
      startIndex: 12,
      endIndex: 13,
      scopes: [
        'source.rgx',
        'meta.regex-line.rgx',
        'string.regexp.rgx',
        'meta.group.regexp',
        'punctuation.definition.group.regexp',
      ],
    });
    expectToken(tokens[6], {
      startIndex: 13,
      endIndex: 14,
      scopes: ['source.rgx', 'meta.regex-line.rgx', 'string.regexp.rgx', 'punctuation.definition.string.end.rgx'],
    });
  });

  it('should tokenize non-capturing groups', () => {
    const line = '/(?:abc)/';
    const { tokens } = grammar.tokenizeLine(line, vscodeTextmate.INITIAL);

    expectToken(tokens[0], {
      startIndex: 0,
      endIndex: 1,
      scopes: ['source.rgx', 'meta.regex-line.rgx', 'string.regexp.rgx', 'punctuation.definition.string.begin.rgx'],
    });
    expectToken(tokens[1], {
      startIndex: 1,
      endIndex: 2,
      scopes: [
        'source.rgx',
        'meta.regex-line.rgx',
        'string.regexp.rgx',
        'meta.group.regexp',
        'punctuation.definition.group.regexp',
      ],
    });
    expectToken(tokens[2], {
      startIndex: 2,
      endIndex: 4,
      scopes: [
        'source.rgx',
        'meta.regex-line.rgx',
        'string.regexp.rgx',
        'meta.group.regexp',
        'punctuation.definition.group.regexp',
        'punctuation.definition.group.no-capture.regexp',
      ],
    });
    expectToken(tokens[3], {
      startIndex: 4,
      endIndex: 7,
      scopes: ['source.rgx', 'meta.regex-line.rgx', 'string.regexp.rgx', 'meta.group.regexp'],
    });
    expectToken(tokens[4], {
      startIndex: 7,
      endIndex: 8,
      scopes: [
        'source.rgx',
        'meta.regex-line.rgx',
        'string.regexp.rgx',
        'meta.group.regexp',
        'punctuation.definition.group.regexp',
      ],
    });
    expectToken(tokens[5], {
      startIndex: 8,
      endIndex: 9,
      scopes: ['source.rgx', 'meta.regex-line.rgx', 'string.regexp.rgx', 'punctuation.definition.string.end.rgx'],
    });
  });

  it('should tokenize character classes', () => {
    const line = '/[\\w\\d]/';
    const { tokens } = grammar.tokenizeLine(line, vscodeTextmate.INITIAL);

    expectToken(tokens[0], {
      startIndex: 0,
      endIndex: 1,
      scopes: ['source.rgx', 'meta.regex-line.rgx', 'string.regexp.rgx', 'punctuation.definition.string.begin.rgx'],
    });
    expectToken(tokens[1], {
      startIndex: 1,
      endIndex: 2,
      scopes: [
        'source.rgx',
        'meta.regex-line.rgx',
        'string.regexp.rgx',
        'constant.other.character-class.set.regexp',
        'punctuation.definition.character-class.regexp',
      ],
    });
    expectToken(tokens[2], {
      startIndex: 2,
      endIndex: 4,
      scopes: [
        'source.rgx',
        'meta.regex-line.rgx',
        'string.regexp.rgx',
        'constant.other.character-class.set.regexp',
        'constant.other.character-class.regexp',
      ],
    });
    expectToken(tokens[3], {
      startIndex: 4,
      endIndex: 6,
      scopes: [
        'source.rgx',
        'meta.regex-line.rgx',
        'string.regexp.rgx',
        'constant.other.character-class.set.regexp',
        'constant.other.character-class.regexp',
      ],
    });
    expectToken(tokens[4], {
      startIndex: 6,
      endIndex: 7,
      scopes: [
        'source.rgx',
        'meta.regex-line.rgx',
        'string.regexp.rgx',
        'constant.other.character-class.set.regexp',
        'punctuation.definition.character-class.regexp',
      ],
    });
    expectToken(tokens[5], {
      startIndex: 7,
      endIndex: 8,
      scopes: ['source.rgx', 'meta.regex-line.rgx', 'string.regexp.rgx', 'punctuation.definition.string.end.rgx'],
    });
  });

  it('should tokenize anchors', () => {
    const line = '/^abc$/';
    const { tokens } = grammar.tokenizeLine(line, vscodeTextmate.INITIAL);

    expectToken(tokens[0], {
      startIndex: 0,
      endIndex: 1,
      scopes: ['source.rgx', 'meta.regex-line.rgx', 'string.regexp.rgx', 'punctuation.definition.string.begin.rgx'],
    });
    expectToken(tokens[1], {
      startIndex: 1,
      endIndex: 2,
      scopes: ['source.rgx', 'meta.regex-line.rgx', 'string.regexp.rgx', 'keyword.control.anchor.regexp'],
    });
    expectToken(tokens[2], {
      startIndex: 2,
      endIndex: 5,
      scopes: ['source.rgx', 'meta.regex-line.rgx', 'string.regexp.rgx'],
    });
    expectToken(tokens[3], {
      startIndex: 5,
      endIndex: 6,
      scopes: ['source.rgx', 'meta.regex-line.rgx', 'string.regexp.rgx', 'keyword.control.anchor.regexp'],
    });
    expectToken(tokens[4], {
      startIndex: 6,
      endIndex: 7,
      scopes: ['source.rgx', 'meta.regex-line.rgx', 'string.regexp.rgx', 'punctuation.definition.string.end.rgx'],
    });

    expect(tokens.some((t) => t.scopes.includes('keyword.control.anchor.regexp'))).toBe(true);
  });

  it('should tokenize alternation', () => {
    const line = '/a|b/';
    const { tokens } = grammar.tokenizeLine(line, vscodeTextmate.INITIAL);

    expectToken(tokens[0], {
      startIndex: 0,
      endIndex: 1,
      scopes: ['source.rgx', 'meta.regex-line.rgx', 'string.regexp.rgx', 'punctuation.definition.string.begin.rgx'],
    });
    expectToken(tokens[1], {
      startIndex: 1,
      endIndex: 2,
      scopes: ['source.rgx', 'meta.regex-line.rgx', 'string.regexp.rgx'],
    });
    expectToken(tokens[2], {
      startIndex: 2,
      endIndex: 3,
      scopes: ['source.rgx', 'meta.regex-line.rgx', 'string.regexp.rgx', 'keyword.operator.or.regexp'],
    });
    expectToken(tokens[3], {
      startIndex: 3,
      endIndex: 4,
      scopes: ['source.rgx', 'meta.regex-line.rgx', 'string.regexp.rgx'],
    });
    expectToken(tokens[4], {
      startIndex: 4,
      endIndex: 5,
      scopes: ['source.rgx', 'meta.regex-line.rgx', 'string.regexp.rgx', 'punctuation.definition.string.end.rgx'],
    });
  });

  it('should tokenize backreferences', () => {
    const line = '/(a)\\1/';
    const { tokens } = grammar.tokenizeLine(line, vscodeTextmate.INITIAL);

    expectToken(tokens[0], {
      startIndex: 0,
      endIndex: 1,
      scopes: ['source.rgx', 'meta.regex-line.rgx', 'string.regexp.rgx', 'punctuation.definition.string.begin.rgx'],
    });
    expectToken(tokens[1], {
      startIndex: 1,
      endIndex: 2,
      scopes: [
        'source.rgx',
        'meta.regex-line.rgx',
        'string.regexp.rgx',
        'meta.group.regexp',
        'punctuation.definition.group.regexp',
      ],
    });
    expectToken(tokens[2], {
      startIndex: 2,
      endIndex: 3,
      scopes: ['source.rgx', 'meta.regex-line.rgx', 'string.regexp.rgx', 'meta.group.regexp'],
    });
    expectToken(tokens[3], {
      startIndex: 3,
      endIndex: 4,
      scopes: [
        'source.rgx',
        'meta.regex-line.rgx',
        'string.regexp.rgx',
        'meta.group.regexp',
        'punctuation.definition.group.regexp',
      ],
    });
    expectToken(tokens[4], {
      startIndex: 4,
      endIndex: 6,
      scopes: ['source.rgx', 'meta.regex-line.rgx', 'string.regexp.rgx', 'keyword.other.back-reference.regexp'],
    });
    expectToken(tokens[5], {
      startIndex: 6,
      endIndex: 7,
      scopes: ['source.rgx', 'meta.regex-line.rgx', 'string.regexp.rgx', 'punctuation.definition.string.end.rgx'],
    });
  });

  it('should tokenize lookahead and lookbehind', () => {
    const line = '/a(?=b)(?<=c)/';
    const { tokens } = grammar.tokenizeLine(line, vscodeTextmate.INITIAL);

    expectToken(tokens[0], {
      startIndex: 0,
      endIndex: 1,
      scopes: ['source.rgx', 'meta.regex-line.rgx', 'string.regexp.rgx', 'punctuation.definition.string.begin.rgx'],
    });
    expectToken(tokens[1], {
      startIndex: 1,
      endIndex: 2,
      scopes: ['source.rgx', 'meta.regex-line.rgx', 'string.regexp.rgx'],
    });
    expectToken(tokens[2], {
      startIndex: 2,
      endIndex: 3,
      scopes: [
        'source.rgx',
        'meta.regex-line.rgx',
        'string.regexp.rgx',
        'meta.group.assertion.regexp',
        'punctuation.definition.group.regexp',
      ],
    });
    expectToken(tokens[3], {
      startIndex: 3,
      endIndex: 5,
      scopes: [
        'source.rgx',
        'meta.regex-line.rgx',
        'string.regexp.rgx',
        'meta.group.assertion.regexp',
        'punctuation.definition.group.assertion.regexp',
        'meta.assertion.look-ahead.regexp',
      ],
    });
    expectToken(tokens[4], {
      startIndex: 5,
      endIndex: 6,
      scopes: ['source.rgx', 'meta.regex-line.rgx', 'string.regexp.rgx', 'meta.group.assertion.regexp'],
    });
    expectToken(tokens[5], {
      startIndex: 6,
      endIndex: 7,
      scopes: [
        'source.rgx',
        'meta.regex-line.rgx',
        'string.regexp.rgx',
        'meta.group.assertion.regexp',
        'punctuation.definition.group.regexp',
      ],
    });
    expectToken(tokens[6], {
      startIndex: 7,
      endIndex: 8,
      scopes: [
        'source.rgx',
        'meta.regex-line.rgx',
        'string.regexp.rgx',
        'meta.group.assertion.regexp',
        'punctuation.definition.group.regexp',
      ],
    });
    expectToken(tokens[7], {
      startIndex: 8,
      endIndex: 11,
      scopes: [
        'source.rgx',
        'meta.regex-line.rgx',
        'string.regexp.rgx',
        'meta.group.assertion.regexp',
        'punctuation.definition.group.assertion.regexp',
        'meta.assertion.look-behind.regexp',
      ],
    });
    expectToken(tokens[8], {
      startIndex: 11,
      endIndex: 12,
      scopes: ['source.rgx', 'meta.regex-line.rgx', 'string.regexp.rgx', 'meta.group.assertion.regexp'],
    });
    expectToken(tokens[9], {
      startIndex: 12,
      endIndex: 13,
      scopes: [
        'source.rgx',
        'meta.regex-line.rgx',
        'string.regexp.rgx',
        'meta.group.assertion.regexp',
        'punctuation.definition.group.regexp',
      ],
    });
    expectToken(tokens[10], {
      startIndex: 13,
      endIndex: 14,
      scopes: ['source.rgx', 'meta.regex-line.rgx', 'string.regexp.rgx', 'punctuation.definition.string.end.rgx'],
    });
  });

  it('should tokenize flags', () => {
    const line = '/abc/gi';
    const { tokens } = grammar.tokenizeLine(line, vscodeTextmate.INITIAL);

    expectToken(tokens[0], {
      startIndex: 0,
      endIndex: 1,
      scopes: ['source.rgx', 'meta.regex-line.rgx', 'string.regexp.rgx', 'punctuation.definition.string.begin.rgx'],
    });
    expectToken(tokens[1], {
      startIndex: 1,
      endIndex: 4,
      scopes: ['source.rgx', 'meta.regex-line.rgx', 'string.regexp.rgx'],
    });
    expectToken(tokens[2], {
      startIndex: 4,
      endIndex: 5,
      scopes: ['source.rgx', 'meta.regex-line.rgx', 'string.regexp.rgx', 'punctuation.definition.string.end.rgx'],
    });
    expectToken(tokens[3], {
      startIndex: 5,
      endIndex: 7,
      scopes: [
        'source.rgx',
        'meta.regex-line.rgx',
        'string.regexp.rgx',
        'punctuation.definition.string.end.rgx',
        'keyword.other.rgx',
      ],
    });
  });

  it('should tokenize a full test block with multiple lines', () => {
    const lines = ['/[0-9]+a+/gm', '---', '123aaa', 'b2507ab', '2024aa', '---'];
    let ruleStack = vscodeTextmate.INITIAL;
    const allTokens = [];
    for (const line of lines) {
      const res = grammar.tokenizeLine(line, ruleStack);
      allTokens.push({ line, tokens: res.tokens });
      ruleStack = res.ruleStack;
    }

    expectToken(allTokens[0].tokens[0], {
      startIndex: 0,
      endIndex: 1,
      scopes: ['source.rgx', 'meta.regex-line.rgx', 'string.regexp.rgx', 'punctuation.definition.string.begin.rgx'],
    });
    expectToken(allTokens[0].tokens[1], {
      startIndex: 1,
      endIndex: 2,
      scopes: [
        'source.rgx',
        'meta.regex-line.rgx',
        'string.regexp.rgx',
        'constant.other.character-class.set.regexp',
        'punctuation.definition.character-class.regexp',
      ],
    });
    expectToken(allTokens[0].tokens[2], {
      startIndex: 2,
      endIndex: 5,
      scopes: ['source.rgx', 'meta.regex-line.rgx', 'string.regexp.rgx', 'constant.other.character-class.set.regexp'],
    });
    expectToken(allTokens[0].tokens[3], {
      startIndex: 5,
      endIndex: 6,
      scopes: [
        'source.rgx',
        'meta.regex-line.rgx',
        'string.regexp.rgx',
        'constant.other.character-class.set.regexp',
        'punctuation.definition.character-class.regexp',
      ],
    });
    expectToken(allTokens[0].tokens[4], {
      startIndex: 6,
      endIndex: 7,
      scopes: ['source.rgx', 'meta.regex-line.rgx', 'string.regexp.rgx', 'keyword.operator.quantifier.regexp'],
    });
    expectToken(allTokens[0].tokens[5], {
      startIndex: 7,
      endIndex: 8,
      scopes: ['source.rgx', 'meta.regex-line.rgx', 'string.regexp.rgx'],
    });
    expectToken(allTokens[0].tokens[6], {
      startIndex: 8,
      endIndex: 9,
      scopes: ['source.rgx', 'meta.regex-line.rgx', 'string.regexp.rgx', 'keyword.operator.quantifier.regexp'],
    });
    expectToken(allTokens[0].tokens[7], {
      startIndex: 9,
      endIndex: 10,
      scopes: ['source.rgx', 'meta.regex-line.rgx', 'string.regexp.rgx', 'punctuation.definition.string.end.rgx'],
    });
    expectToken(allTokens[0].tokens[8], {
      startIndex: 10,
      endIndex: 12,
      scopes: [
        'source.rgx',
        'meta.regex-line.rgx',
        'string.regexp.rgx',
        'punctuation.definition.string.end.rgx',
        'keyword.other.rgx',
      ],
    });
    expectToken(allTokens[1].tokens[0], {
      startIndex: 0,
      endIndex: 4,
      scopes: ['source.rgx', 'meta.test-block.rgx', 'punctuation.separator.test.begin.rgx'],
    });
    expectToken(allTokens[2].tokens[0], {
      startIndex: 0,
      endIndex: 6,
      scopes: ['source.rgx', 'meta.test-block.rgx', 'text.test-content.rgx'],
    });
    expectToken(allTokens[3].tokens[0], {
      startIndex: 0,
      endIndex: 7,
      scopes: ['source.rgx', 'meta.test-block.rgx', 'text.test-content.rgx'],
    });
    expectToken(allTokens[4].tokens[0], {
      startIndex: 0,
      endIndex: 6,
      scopes: ['source.rgx', 'meta.test-block.rgx', 'text.test-content.rgx'],
    });
    expectToken(allTokens[5].tokens[0], {
      startIndex: 0,
      endIndex: 4,
      scopes: ['source.rgx', 'meta.test-block.rgx', 'punctuation.separator.test.end.rgx'],
    });
  });

  it('should tokenize two test blocks correctly', () => {
    const lines = [
      '/[0-9]+a+/gm',
      '---',
      '123aaa',
      'b2507ab',
      '2024aa',
      '---',
      '',
      '/[a-z]+/',
      '---',
      'abc',
      'def',
      '---',
    ];
    let ruleStack = vscodeTextmate.INITIAL;
    const allTokens = [];
    for (const line of lines) {
      const res = grammar.tokenizeLine(line, ruleStack);
      allTokens.push({ line, tokens: res.tokens });
      ruleStack = res.ruleStack;
    }

    expectToken(allTokens[0].tokens[0], {
      startIndex: 0,
      endIndex: 1,
      scopes: ['source.rgx', 'meta.regex-line.rgx', 'string.regexp.rgx', 'punctuation.definition.string.begin.rgx'],
    });
    expectToken(allTokens[0].tokens[1], {
      startIndex: 1,
      endIndex: 2,
      scopes: [
        'source.rgx',
        'meta.regex-line.rgx',
        'string.regexp.rgx',
        'constant.other.character-class.set.regexp',
        'punctuation.definition.character-class.regexp',
      ],
    });
    expectToken(allTokens[0].tokens[2], {
      startIndex: 2,
      endIndex: 5,
      scopes: ['source.rgx', 'meta.regex-line.rgx', 'string.regexp.rgx', 'constant.other.character-class.set.regexp'],
    });
    expectToken(allTokens[0].tokens[3], {
      startIndex: 5,
      endIndex: 6,
      scopes: [
        'source.rgx',
        'meta.regex-line.rgx',
        'string.regexp.rgx',
        'constant.other.character-class.set.regexp',
        'punctuation.definition.character-class.regexp',
      ],
    });
    expectToken(allTokens[0].tokens[4], {
      startIndex: 6,
      endIndex: 7,
      scopes: ['source.rgx', 'meta.regex-line.rgx', 'string.regexp.rgx', 'keyword.operator.quantifier.regexp'],
    });
    expectToken(allTokens[0].tokens[5], {
      startIndex: 7,
      endIndex: 8,
      scopes: ['source.rgx', 'meta.regex-line.rgx', 'string.regexp.rgx'],
    });
    expectToken(allTokens[0].tokens[6], {
      startIndex: 8,
      endIndex: 9,
      scopes: ['source.rgx', 'meta.regex-line.rgx', 'string.regexp.rgx', 'keyword.operator.quantifier.regexp'],
    });
    expectToken(allTokens[0].tokens[7], {
      startIndex: 9,
      endIndex: 10,
      scopes: ['source.rgx', 'meta.regex-line.rgx', 'string.regexp.rgx', 'punctuation.definition.string.end.rgx'],
    });
    expectToken(allTokens[0].tokens[8], {
      startIndex: 10,
      endIndex: 12,
      scopes: [
        'source.rgx',
        'meta.regex-line.rgx',
        'string.regexp.rgx',
        'punctuation.definition.string.end.rgx',
        'keyword.other.rgx',
      ],
    });

    expectToken(allTokens[1].tokens[0], {
      startIndex: 0,
      endIndex: 4,
      scopes: ['source.rgx', 'meta.test-block.rgx', 'punctuation.separator.test.begin.rgx'],
    });

    expectToken(allTokens[2].tokens[0], {
      startIndex: 0,
      endIndex: 6,
      scopes: ['source.rgx', 'meta.test-block.rgx', 'text.test-content.rgx'],
    });

    expectToken(allTokens[3].tokens[0], {
      startIndex: 0,
      endIndex: 7,
      scopes: ['source.rgx', 'meta.test-block.rgx', 'text.test-content.rgx'],
    });

    expectToken(allTokens[4].tokens[0], {
      startIndex: 0,
      endIndex: 6,
      scopes: ['source.rgx', 'meta.test-block.rgx', 'text.test-content.rgx'],
    });

    expectToken(allTokens[5].tokens[0], {
      startIndex: 0,
      endIndex: 4,
      scopes: ['source.rgx', 'meta.test-block.rgx', 'punctuation.separator.test.end.rgx'],
    });

    expectToken(allTokens[6].tokens[0], {
      startIndex: 0,
      endIndex: 1,
      scopes: ['source.rgx'],
    });

    expectToken(allTokens[7].tokens[0], {
      startIndex: 0,
      endIndex: 1,
      scopes: ['source.rgx', 'meta.regex-line.rgx', 'string.regexp.rgx', 'punctuation.definition.string.begin.rgx'],
    });
    expectToken(allTokens[7].tokens[1], {
      startIndex: 1,
      endIndex: 2,
      scopes: [
        'source.rgx',
        'meta.regex-line.rgx',
        'string.regexp.rgx',
        'constant.other.character-class.set.regexp',
        'punctuation.definition.character-class.regexp',
      ],
    });
    expectToken(allTokens[7].tokens[2], {
      startIndex: 2,
      endIndex: 5,
      scopes: ['source.rgx', 'meta.regex-line.rgx', 'string.regexp.rgx', 'constant.other.character-class.set.regexp'],
    });
    expectToken(allTokens[7].tokens[3], {
      startIndex: 5,
      endIndex: 6,
      scopes: [
        'source.rgx',
        'meta.regex-line.rgx',
        'string.regexp.rgx',
        'constant.other.character-class.set.regexp',
        'punctuation.definition.character-class.regexp',
      ],
    });
    expectToken(allTokens[7].tokens[4], {
      startIndex: 6,
      endIndex: 7,
      scopes: ['source.rgx', 'meta.regex-line.rgx', 'string.regexp.rgx', 'keyword.operator.quantifier.regexp'],
    });
    expectToken(allTokens[7].tokens[5], {
      startIndex: 7,
      endIndex: 8,
      scopes: ['source.rgx', 'meta.regex-line.rgx', 'string.regexp.rgx', 'punctuation.definition.string.end.rgx'],
    });

    expectToken(allTokens[8].tokens[0], {
      startIndex: 0,
      endIndex: 4,
      scopes: ['source.rgx', 'meta.test-block.rgx', 'punctuation.separator.test.begin.rgx'],
    });

    expectToken(allTokens[9].tokens[0], {
      startIndex: 0,
      endIndex: 3,
      scopes: ['source.rgx', 'meta.test-block.rgx', 'text.test-content.rgx'],
    });

    expectToken(allTokens[10].tokens[0], {
      startIndex: 0,
      endIndex: 3,
      scopes: ['source.rgx', 'meta.test-block.rgx', 'text.test-content.rgx'],
    });

    expectToken(allTokens[11].tokens[0], {
      startIndex: 0,
      endIndex: 4,
      scopes: ['source.rgx', 'meta.test-block.rgx', 'punctuation.separator.test.end.rgx'],
    });
  });

  it('should tokenize negated character class', () => {
    const line = '/[^a]/';
    const { tokens } = grammar.tokenizeLine(line, vscodeTextmate.INITIAL);

    expectToken(tokens[0], {
      startIndex: 0,
      endIndex: 1,
      scopes: ['source.rgx', 'meta.regex-line.rgx', 'string.regexp.rgx', 'punctuation.definition.string.begin.rgx'],
    });
    expectToken(tokens[1], {
      startIndex: 1,
      endIndex: 2,
      scopes: [
        'source.rgx',
        'meta.regex-line.rgx',
        'string.regexp.rgx',
        'constant.other.character-class.set.regexp',
        'punctuation.definition.character-class.regexp',
      ],
    });
    expectToken(tokens[2], {
      startIndex: 2,
      endIndex: 3,
      scopes: [
        'source.rgx',
        'meta.regex-line.rgx',
        'string.regexp.rgx',
        'constant.other.character-class.set.regexp',
        'keyword.operator.negation.regexp',
      ],
    });
    expectToken(tokens[3], {
      startIndex: 3,
      endIndex: 4,
      scopes: ['source.rgx', 'meta.regex-line.rgx', 'string.regexp.rgx', 'constant.other.character-class.set.regexp'],
    });
    expectToken(tokens[4], {
      startIndex: 4,
      endIndex: 5,
      scopes: [
        'source.rgx',
        'meta.regex-line.rgx',
        'string.regexp.rgx',
        'constant.other.character-class.set.regexp',
        'punctuation.definition.character-class.regexp',
      ],
    });
    expectToken(tokens[5], {
      startIndex: 5,
      endIndex: 6,
      scopes: ['source.rgx', 'meta.regex-line.rgx', 'string.regexp.rgx', 'punctuation.definition.string.end.rgx'],
    });
  });

  it('should tokenize negative lookahead and lookbehind', () => {
    const line = '/a(?!b)(?<!c)/';
    const { tokens } = grammar.tokenizeLine(line, vscodeTextmate.INITIAL);

    expectTokenWithScopes(tokens, ['meta.group.assertion.regexp', 'meta.assertion.negative-look-ahead.regexp']);
    expectTokenWithScopes(tokens, ['meta.group.assertion.regexp', 'meta.assertion.negative-look-behind.regexp']);
  });

  it('should tokenize named backreference', () => {
    const line = '/(a)\\k<name>/';
    const { tokens } = grammar.tokenizeLine(line, vscodeTextmate.INITIAL);

    expectTokenWithScopes(tokens, ['keyword.other.back-reference.regexp']);
    expectTokenWithScopes(tokens, ['variable.other.regexp']);
  });

  it('should tokenize numeric and control escapes', () => {
    const line = '/\\x4F\\u00A9\\cA/';
    const { tokens } = grammar.tokenizeLine(line, vscodeTextmate.INITIAL);

    expectTokenWithScopes(tokens, ['constant.character.numeric.regexp']);
    expectTokenWithScopes(tokens, ['constant.character.control.regexp']);
  });

  it('should treat regex-like text inside test block as text', () => {
    const lines = ['---', '/abc/', '---'];
    let ruleStack = vscodeTextmate.INITIAL;
    const allTokens: { line: string; tokens: vscodeTextmate.IToken[] }[] = [];
    for (const line of lines) {
      const res = grammar.tokenizeLine(line, ruleStack);
      allTokens.push({ line, tokens: res.tokens });
      ruleStack = res.ruleStack;
    }

    expectToken(allTokens[1].tokens[0], {
      startIndex: 0,
      endIndex: 5,
      scopes: ['source.rgx', 'meta.test-block.rgx', 'text.test-content.rgx'],
    });
  });

  it('should not tokenize plain text as regex line', () => {
    const line = 'abc/def';
    const { tokens } = grammar.tokenizeLine(line, vscodeTextmate.INITIAL);

    expectToken(tokens[0], {
      startIndex: 0,
      endIndex: 8,
      scopes: ['source.rgx'],
    });
    expectNotTokenWithScopes(tokens, ['meta.regex-line.rgx']);
  });

  it('should not treat indented regex as regex line', () => {
    const line = '  /abc/';
    const { tokens } = grammar.tokenizeLine(line, vscodeTextmate.INITIAL);

    expectToken(tokens[0], {
      startIndex: 0,
      endIndex: 8,
      scopes: ['source.rgx'],
    });
    expectNotTokenWithScopes(tokens, ['meta.regex-line.rgx']);
  });

  it('should not start test block for malformed delimiter', () => {
    const line = '---x';
    const { tokens } = grammar.tokenizeLine(line, vscodeTextmate.INITIAL);

    expectToken(tokens[0], {
      startIndex: 0,
      endIndex: 5,
      scopes: ['source.rgx'],
    });
    expectNotTokenWithScopes(tokens, ['meta.test-block.rgx']);
    expectNotTokenWithScopes(tokens, ['punctuation.separator.test.begin.rgx']);
  });
});
