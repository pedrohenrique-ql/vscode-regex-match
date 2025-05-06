import { CodeLensProvider, ConfigurationChangeEvent, Disposable, ExtensionContext, languages, workspace } from 'vscode';

import { REGEX_MATCH_LANGUAGE_ID } from '@/extension';

class TestRegexCodeLensManagerService implements Disposable {
  private codeLensProvider: CodeLensProvider;

  private codeLensDisposable: Disposable | undefined;
  private configurationChangeDisposable: Disposable;

  constructor(
    private context: ExtensionContext,
    codeLensProvider: CodeLensProvider,
  ) {
    this.codeLensProvider = codeLensProvider;
    this.updateCodeLensProvider();

    this.configurationChangeDisposable = workspace.onDidChangeConfiguration((event) =>
      this.onConfigurationChange(event),
    );
  }

  private onConfigurationChange(event: ConfigurationChangeEvent) {
    if (event.affectsConfiguration('regex-match.codeLens.enabled')) {
      this.updateCodeLensProvider();
    }
  }

  private updateCodeLensProvider() {
    const isCodeLensEnabled = workspace.getConfiguration(REGEX_MATCH_LANGUAGE_ID).get<boolean>('codeLens.enabled');

    if (isCodeLensEnabled && !this.codeLensDisposable) {
      this.codeLensDisposable = languages.registerCodeLensProvider(
        { pattern: '**/*', scheme: 'file' },
        this.codeLensProvider,
      );

      this.context.subscriptions.push(this.codeLensDisposable);
    } else if (!isCodeLensEnabled && this.codeLensDisposable) {
      this.codeLensDisposable.dispose();
      this.codeLensDisposable = undefined;
    }
  }

  dispose() {
    if (this.codeLensDisposable) {
      this.codeLensDisposable.dispose();
    }

    this.configurationChangeDisposable.dispose();
  }
}

export default TestRegexCodeLensManagerService;
