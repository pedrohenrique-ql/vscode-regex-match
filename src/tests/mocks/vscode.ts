export const Uri = {
  file: (path: string) => ({ fsPath: path, toString: () => `file://${path}` }),
  parse: (uri: string) => ({ fsPath: uri, toString: () => uri }),
};

export class Position {
  constructor(
    public line: number,
    public character: number,
  ) {}
}

export class Range {
  constructor(
    public start: Position,
    public end: Position,
  ) {}
}

export class EventEmitter<T> {
  private listeners: ((e: T) => void)[] = [];

  get event() {
    return (listener: (e: T) => void) => {
      this.listeners.push(listener);
      return {
        dispose: () => {
          const index = this.listeners.indexOf(listener);
          if (index >= 0) {
            this.listeners.splice(index, 1);
          }
        },
      };
    };
  }

  fire(data: T): void {
    this.listeners.forEach((listener) => listener(data));
  }
}

export class CodeLens {
  constructor(
    public range: Range,
    public command?: {
      title: string;
      command: string;
      arguments?: unknown[];
    },
  ) {}
}

export const workspace = {
  textDocuments: [],
  getConfiguration: () => ({
    get: () => undefined,
    has: () => false,
    inspect: () => undefined,
    update: () => Promise.resolve(),
  }),
  onDidOpenTextDocument: () => ({
    dispose: () => {
      /* empty */
    },
  }),
  onDidCloseTextDocument: () => ({
    dispose: () => {
      /* empty */
    },
  }),
  onDidChangeTextDocument: () => ({
    dispose: () => {
      /* empty */
    },
  }),
};
