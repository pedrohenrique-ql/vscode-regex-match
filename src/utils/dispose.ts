import { Disposable } from 'vscode';

export function disposeAll(disposables: Disposable[]) {
  while (disposables.length > 0) {
    const item = disposables.pop();
    if (item) {
      item.dispose();
    }
  }
}
