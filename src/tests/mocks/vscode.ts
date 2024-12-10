export const Uri = {
  file: (path: string) => ({ fsPath: path, toString: () => `file://${path}` }),
};

export class Range {
  constructor(
    public startLine: number,
    public startChar: number,
    public endLine: number,
    public endChar: number,
  ) {}
}
