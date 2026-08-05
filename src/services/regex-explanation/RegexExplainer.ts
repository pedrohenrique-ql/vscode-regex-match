import { RegExpParser, RegExpSyntaxError, visitRegExpAST, type AST } from '@eslint-community/regexpp';

export interface RegexExplanation {
  token: string;
  description: string;
  range: [number, number];
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

class RegexExplainer {
  private static parser = new RegExpParser();

  static explainAt(lineText: string, characterIndex: number): RegexExplanation[] {
    const ast = this.parseLine(lineText);
    if (!ast) {
      return [];
    }

    if (ast.type === 'RegExpLiteral') {
      if (characterIndex >= ast.flags.start && characterIndex < ast.flags.end) {
        return this.explainFlags(ast.flags, characterIndex);
      }

      if (characterIndex === 0 || characterIndex === ast.pattern.end) {
        return [];
      }
    }

    const innermostNode = this.findInnermostNode(ast, characterIndex);
    if (!innermostNode) {
      return [];
    }

    const flags = ast.type === 'RegExpLiteral' ? ast.flags.raw : '';

    if (lineText[characterIndex] === '|' && innermostNode.type !== 'Character') {
      const alternation: RegexExplanation = {
        token: '|',
        description: 'alternation — matches either the expression before or after the `|`',
        range: [characterIndex, characterIndex + 1],
      };

      const enclosingNodes = [innermostNode, ...this.ancestorsOf(innermostNode)].filter((node) =>
        this.isExplainable(node),
      );

      return [alternation, ...enclosingNodes.map((node) => this.describeNode(node, flags))];
    }

    const explainableAncestors = this.ancestorsOf(innermostNode).filter((node) => this.isExplainable(node));

    return [innermostNode, ...explainableAncestors].map((node) => this.describeNode(node, flags));
  }

  private static parseLine(lineText: string): AST.RegExpLiteral | AST.Pattern | undefined {
    try {
      return this.parser.parseLiteral(lineText);
    } catch (error) {
      if (!(error instanceof RegExpSyntaxError)) {
        throw error;
      }
    }

    try {
      return this.parser.parsePattern(lineText);
    } catch (error) {
      if (!(error instanceof RegExpSyntaxError)) {
        throw error;
      }

      return undefined;
    }
  }

  private static collectNodes(root: AST.Node): AST.Node[] {
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
      onModifierFlagsEnter: collect,
      onModifiersEnter: collect,
      onPatternEnter: collect,
      onQuantifierEnter: collect,
      onRegExpLiteralEnter: collect,
      onStringAlternativeEnter: collect,
    });

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

    return min === max ? `exactly ${min} times` : `between ${min} and ${max} times`;
  }

  private static describeQuantifier(node: AST.Quantifier): string {
    const times = this.describeQuantifierTimes(node.min, node.max);
    const appetite = node.greedy ? 'as many times as possible (greedy)' : 'as few times as possible (lazy)';

    return `matches the previous token ${times}, ${appetite}`;
  }

  private static describeCharacterSet(node: AST.CharacterSet, flags: string): string {
    if (node.kind === 'any') {
      return flags.includes('s')
        ? 'matches any character, including line terminators (`s` flag)'
        : 'matches any character except line terminators';
    }

    if (node.kind === 'property') {
      const property = node.value === null ? node.key : `${node.key}=${node.value}`;
      return node.negate
        ? `matches any character that does not have the Unicode property \`${property}\``
        : `matches any character with the Unicode property \`${property}\``;
    }

    const descriptions = ESCAPE_CHARACTER_SET_DESCRIPTIONS[node.kind];
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

  private static describeNonQuantifierNode(node: AST.Node, flags: string): string {
    if (node.type === 'Character') {
      const controlCharacterName = CONTROL_CHARACTER_NAMES[node.value];
      return controlCharacterName
        ? `matches a ${controlCharacterName} character`
        : `matches the character \`${node.raw}\` literally`;
    }

    if (node.type === 'CharacterSet') {
      return this.describeCharacterSet(node, flags);
    }

    if (node.type === 'CharacterClass') {
      return node.negate
        ? 'matches a single character not present in the list'
        : 'matches a single character present in the list';
    }

    if (node.type === 'CharacterClassRange') {
      return `matches a single character in the range \`${node.min.raw}\` to \`${node.max.raw}\``;
    }

    if (node.type === 'CapturingGroup') {
      const index = this.capturingGroupIndex(node);
      return node.name === null
        ? `capturing group ${index}`
        : `named capturing group \`${node.name}\` (group ${index})`;
    }

    if (node.type === 'Group') {
      return 'non-capturing group';
    }

    if (node.type === 'Assertion') {
      return this.describeAssertion(node);
    }

    if (node.type === 'Backreference') {
      return typeof node.ref === 'number'
        ? `matches the same text most recently matched by group ${node.ref}`
        : `matches the same text most recently matched by the named group \`${node.ref}\``;
    }

    return `matches \`${node.raw}\` (${this.splitTypeName(node.type)})`;
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

  private static explainFlags(flags: AST.Flags, characterIndex: number): RegexExplanation[] {
    const explanations = [...flags.raw].map<RegexExplanation>((flag, index) => ({
      token: flag,
      description: FLAG_DESCRIPTIONS[flag],
      range: [flags.start + index, flags.start + index + 1],
    }));

    const hoveredIndex = characterIndex - flags.start;

    return [explanations[hoveredIndex], ...explanations.filter((_explanation, index) => index !== hoveredIndex)];
  }
}

export default RegexExplainer;
