import { RegExpParser, RegExpSyntaxError, visitRegExpAST, type AST } from '@eslint-community/regexpp';

import { splitRegexLine } from '@/utils/regex';

export interface RegexExplanation {
  token: string;
  description: string;
  range: [number, number];
}

interface ParsedRegexLine {
  pattern: AST.Pattern;
  flagsRaw: string;
  flagsStart: number;
}

const CONTROL_CHARACTER_NAMES: Record<number, string> = {
  0: 'null',
  9: 'tab',
  10: 'line feed',
  11: 'vertical tab',
  12: 'form feed',
  13: 'carriage return',
};

const ESCAPE_CHARACTER_SET_DESCRIPTIONS = {
  digit: {
    positive: 'matches a digit (equivalent to `[0-9]`)',
    negative: 'matches any character that is not a digit (equivalent to `[^0-9]`)',
  },
  space: {
    positive: 'matches any whitespace character',
    negative: 'matches any character that is not a whitespace character',
  },
  word: {
    positive: 'matches any word character (equivalent to `[a-zA-Z0-9_]`)',
    negative: 'matches any character that is not a word character (equivalent to `[^a-zA-Z0-9_]`)',
  },
};

const UNICODE_CASE_INSENSITIVE_WORD_DESCRIPTIONS = {
  positive: 'matches any word character',
  negative: 'matches any character that is not a word character',
};

const MODIFIER_FLAG_CHARACTERS = {
  ignoreCase: 'i',
  multiline: 'm',
  dotAll: 's',
};

const FLAG_DESCRIPTIONS: Record<string, string> = {
  d: 'generates indices for substring matches',
  g: 'global — finds all matches instead of stopping at the first',
  i: 'case-insensitive matching',
  m: 'multiline — `^` and `$` match line boundaries',
  s: 'dotAll — `.` also matches line terminators',
  u: 'unicode — treats the pattern as a sequence of Unicode code points',
  v: 'unicodeSets — extended Unicode class syntax',
  y: 'sticky — matches only from the position given by lastIndex',
};

const EXPLAINABLE_ANCESTOR_TYPES = [
  'Quantifier',
  'CapturingGroup',
  'Group',
  'CharacterClass',
  'ExpressionCharacterClass',
];

// A `|` inside these nodes is part of their own syntax instead of a pattern alternation.
const NON_ALTERNATION_TYPES = ['Character', 'ClassStringDisjunction'];

export function toInlineCode(value: string): string {
  const backtickRuns = value.match(/`+/g) ?? [];
  const longestBacktickRun = backtickRuns.reduce((longest, run) => Math.max(longest, run.length), 0);

  const fence = '`'.repeat(longestBacktickRun + 1);
  const padding = value.startsWith('`') || value.endsWith('`') ? ' ' : '';

  return `${fence}${padding}${value}${padding}${fence}`;
}

class RegexExplainer {
  private static parser = new RegExpParser();
  private static nodesByRoot = new WeakMap<AST.Node, AST.Node[]>();

  static explainAt(lineText: string, characterIndex: number): RegexExplanation[] {
    const parsedLine = this.parseRegexLine(lineText);
    if (!parsedLine) {
      return [];
    }

    const { pattern, flagsRaw, flagsStart } = parsedLine;

    if (characterIndex >= flagsStart && characterIndex < flagsStart + flagsRaw.length) {
      return this.explainFlags(flagsRaw, flagsStart, characterIndex);
    }

    if (characterIndex < pattern.start || characterIndex >= pattern.end) {
      return [];
    }

    const innermostNode = this.findInnermostNode(pattern, characterIndex);
    if (!innermostNode) {
      return [];
    }

    if (lineText[characterIndex] === '|' && !NON_ALTERNATION_TYPES.includes(innermostNode.type)) {
      const alternation: RegexExplanation = {
        token: '|',
        description: 'alternation — matches either the expression before or after the `|`',
        range: [characterIndex, characterIndex + 1],
      };

      const enclosingNodes = [innermostNode, ...this.ancestorsOf(innermostNode)].filter((node) =>
        this.isExplainable(node),
      );

      return [alternation, ...enclosingNodes.map((node) => this.describeNode(node, flagsRaw))];
    }

    const explainableAncestors = this.ancestorsOf(innermostNode).filter((node) => this.isExplainable(node));

    return [innermostNode, ...explainableAncestors].map((node) => this.describeNode(node, flagsRaw));
  }

  private static parseRegexLine(lineText: string): ParsedRegexLine | undefined {
    const { pattern: patternSource, patternStart, flags, flagsStart, hasValidDelimiters } = splitRegexLine(lineText);

    if (!hasValidDelimiters) {
      return undefined;
    }

    try {
      this.parser.parseFlags(flags);

      const pattern = this.parser.parsePattern(lineText, patternStart, patternStart + patternSource.length, {
        unicode: flags.includes('u'),
        unicodeSets: flags.includes('v'),
      });

      return { pattern, flagsRaw: flags, flagsStart };
    } catch (error) {
      if (!(error instanceof RegExpSyntaxError)) {
        throw error;
      }

      return undefined;
    }
  }

  private static collectNodes(root: AST.Node): AST.Node[] {
    const cachedNodes = this.nodesByRoot.get(root);
    if (cachedNodes) {
      return cachedNodes;
    }

    const nodes: AST.Node[] = [];
    function collect(node: AST.Node): void {
      nodes.push(node);
    }

    visitRegExpAST(root, {
      onAlternativeEnter: collect,
      onAssertionEnter: collect,
      onBackreferenceEnter: collect,
      onCapturingGroupEnter: collect,
      onCharacterEnter: collect,
      onCharacterClassEnter: collect,
      onCharacterClassRangeEnter: collect,
      onCharacterSetEnter: collect,
      onClassIntersectionEnter: collect,
      onClassStringDisjunctionEnter: collect,
      onClassSubtractionEnter: collect,
      onExpressionCharacterClassEnter: collect,
      onGroupEnter: collect,
      onPatternEnter: collect,
      onQuantifierEnter: collect,
      onStringAlternativeEnter: collect,
    });

    this.nodesByRoot.set(root, nodes);

    return nodes;
  }

  private static findInnermostNode(root: AST.Node, characterIndex: number): AST.Node | undefined {
    // Spans are nested and nodes are visited parent first, so the last node containing the index is the deepest one.
    return this.collectNodes(root)
      .filter((node) => node.start <= characterIndex && characterIndex < node.end)
      .at(-1);
  }

  private static ancestorsOf(node: AST.Node): AST.Node[] {
    const ancestors: AST.Node[] = [];

    let current: AST.Node | null = node.parent;
    while (current) {
      ancestors.push(current);
      current = current.parent;
    }

    return ancestors;
  }

  private static isExplainable(node: AST.Node): boolean {
    if (node.type === 'Assertion') {
      return node.kind === 'lookahead' || node.kind === 'lookbehind';
    }

    return EXPLAINABLE_ANCESTOR_TYPES.includes(node.type);
  }

  private static splitTypeName(type: string): string {
    return type.replace(/(?<!^)([A-Z])/g, ' $1').toLowerCase();
  }

  private static capturingGroupIndex(node: AST.CapturingGroup): number {
    const ancestors = this.ancestorsOf(node);
    const root = ancestors.length > 0 ? ancestors[ancestors.length - 1] : node;

    const capturingGroups = this.collectNodes(root)
      .filter((candidate): candidate is AST.CapturingGroup => candidate.type === 'CapturingGroup')
      .sort((first, second) => first.start - second.start);

    return capturingGroups.indexOf(node) + 1;
  }

  private static effectiveFlag(node: AST.Node, flag: 'ignoreCase' | 'multiline' | 'dotAll', flags: string): boolean {
    for (const ancestor of this.ancestorsOf(node)) {
      const modifiers = ancestor.type === 'Group' ? ancestor.modifiers : undefined;
      if (!modifiers) {
        continue;
      }

      if (modifiers.add[flag]) {
        return true;
      }

      if (modifiers.remove?.[flag]) {
        return false;
      }
    }

    return flags.includes(MODIFIER_FLAG_CHARACTERS[flag]);
  }

  private static describeQuantifierTimes(min: number, max: number): string {
    if (min === 0 && max === 1) {
      return 'between zero and one time';
    }

    if (max === Infinity) {
      if (min === 0) {
        return 'zero or more times';
      }

      return min === 1 ? 'one or more times' : `${min} or more times`;
    }

    if (min === max) {
      return min === 1 ? 'exactly one time' : `exactly ${min} times`;
    }

    return `between ${min} and ${max} times`;
  }

  private static describeQuantifier(node: AST.Quantifier): string {
    const times = this.describeQuantifierTimes(node.min, node.max);
    const appetite = node.greedy ? 'as many times as possible (greedy)' : 'as few times as possible (lazy)';

    return `matches the previous token ${times}, ${appetite}`;
  }

  private static describeCharacterSet(node: AST.CharacterSet, flags: string): string {
    if (node.kind === 'any') {
      return this.effectiveFlag(node, 'dotAll', flags)
        ? 'matches any character, including line terminators (`s` flag)'
        : 'matches any character except line terminators';
    }

    if (node.kind === 'property') {
      const property = node.value === null ? node.key : `${node.key}=${node.value}`;
      return node.negate
        ? `matches any character that does not have the Unicode property ${toInlineCode(property)}`
        : `matches any character with the Unicode property ${toInlineCode(property)}`;
    }

    const isUnicodeCaseInsensitive =
      (flags.includes('u') || flags.includes('v')) && this.effectiveFlag(node, 'ignoreCase', flags);

    const descriptions =
      node.kind === 'word' && isUnicodeCaseInsensitive
        ? UNICODE_CASE_INSENSITIVE_WORD_DESCRIPTIONS
        : ESCAPE_CHARACTER_SET_DESCRIPTIONS[node.kind];

    return node.negate ? descriptions.negative : descriptions.positive;
  }

  private static describeAssertion(node: AST.Assertion): string {
    if (node.kind === 'lookahead' || node.kind === 'lookbehind') {
      const text = node.kind === 'lookahead' ? 'following' : 'preceding';

      return node.negate
        ? `negative ${node.kind} — asserts that the ${text} text does not match`
        : `positive ${node.kind} — asserts that the ${text} text matches`;
    }

    if (node.kind === 'word') {
      return node.negate ? 'asserts a position that is not a word boundary' : 'asserts a word boundary';
    }

    return `asserts position at the ${node.kind} of the string (or line with the \`m\` flag)`;
  }

  private static describeGroup(node: AST.Group): string {
    const modifiers = node.modifiers;
    if (!modifiers) {
      return 'non-capturing group';
    }

    const changes: string[] = [];

    if (modifiers.add.raw !== '') {
      changes.push(`enables ${toInlineCode(modifiers.add.raw)}`);
    }

    if (modifiers.remove && modifiers.remove.raw !== '') {
      changes.push(`disables ${toInlineCode(modifiers.remove.raw)}`);
    }

    return changes.length > 0
      ? `non-capturing group that ${changes.join(' and ')} for the tokens inside it`
      : 'non-capturing group';
  }

  private static describeCharacter(node: AST.Character): string {
    const controlCharacterName = CONTROL_CHARACTER_NAMES[node.value];
    if (controlCharacterName) {
      return `matches a ${controlCharacterName} character`;
    }

    const character = String.fromCodePoint(node.value);

    // `a` and identity escapes such as `\.` are spelled as the character they match.
    if (node.raw === character || node.raw === `\\${character}`) {
      return `matches the character ${toInlineCode(character)} literally`;
    }

    const codePoint = `U+${node.value.toString(16).toUpperCase().padStart(4, '0')}`;

    // `\x41`, `\u0041`, `\cA` and the like are spelled as an escape, so the decoded character is shown instead.
    return node.value < 0x20 || node.value === 0x7f
      ? `matches the control character ${codePoint}`
      : `matches the character ${toInlineCode(character)} (${codePoint})`;
  }

  private static describeNonQuantifierNode(node: AST.Node, flags: string): string {
    if (node.type === 'Character') {
      return this.describeCharacter(node);
    }

    if (node.type === 'CharacterSet') {
      return this.describeCharacterSet(node, flags);
    }

    if (node.type === 'CharacterClass') {
      return node.negate
        ? 'matches a single character not present in the list'
        : 'matches a single character present in the list';
    }

    if (node.type === 'ExpressionCharacterClass') {
      return node.negate
        ? 'matches a single character not matched by the class expression'
        : 'matches a single character matched by the class expression';
    }

    if (node.type === 'ClassStringDisjunction') {
      return 'matches any one of the strings of the disjunction';
    }

    if (node.type === 'CharacterClassRange') {
      return `matches a single character in the range ${toInlineCode(node.min.raw)} to ${toInlineCode(node.max.raw)}`;
    }

    if (node.type === 'CapturingGroup') {
      const index = this.capturingGroupIndex(node);
      return node.name === null
        ? `capturing group ${index}`
        : `named capturing group ${toInlineCode(node.name)} (group ${index})`;
    }

    if (node.type === 'Group') {
      return this.describeGroup(node);
    }

    if (node.type === 'Assertion') {
      return this.describeAssertion(node);
    }

    if (node.type === 'Backreference') {
      return typeof node.ref === 'number'
        ? `matches the same text most recently matched by group ${node.ref}`
        : `matches the same text most recently matched by the named group ${toInlineCode(node.ref)}`;
    }

    return `matches ${toInlineCode(node.raw)} (${this.splitTypeName(node.type)})`;
  }

  private static describeNode(node: AST.Node, flags: string): RegexExplanation {
    if (node.type === 'Quantifier') {
      return {
        token: node.raw.slice(node.element.end - node.start),
        description: this.describeQuantifier(node),
        range: [node.element.end, node.end],
      };
    }

    return { token: node.raw, description: this.describeNonQuantifierNode(node, flags), range: [node.start, node.end] };
  }

  private static explainFlags(flagsRaw: string, flagsStart: number, characterIndex: number): RegexExplanation[] {
    const explanations = [...flagsRaw].flatMap<RegexExplanation>((flag, index) => {
      const description = FLAG_DESCRIPTIONS[flag];

      return description ? [{ token: flag, description, range: [flagsStart + index, flagsStart + index + 1] }] : [];
    });

    const hoveredExplanation = explanations.find(({ range }) => range[0] === characterIndex);
    if (!hoveredExplanation) {
      return [];
    }

    return [hoveredExplanation, ...explanations.filter((explanation) => explanation !== hoveredExplanation)];
  }
}

export default RegexExplainer;
