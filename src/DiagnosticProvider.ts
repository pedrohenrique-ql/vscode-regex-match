import { Diagnostic, DiagnosticCollection, DiagnosticSeverity, Range, Uri, languages } from 'vscode';

class DiagnosticProvider {
  private diagnosticCollection: DiagnosticCollection;

  constructor(diagnosticCollectionName: string) {
    this.diagnosticCollection = languages.createDiagnosticCollection(diagnosticCollectionName);
  }

  getDiagnosticCollection() {
    return this.diagnosticCollection;
  }

  createErrorDiagnostic(range: Range, message: string) {
    const errorDiagnostic = new Diagnostic(range, message, DiagnosticSeverity.Error);
    return errorDiagnostic;
  }

  createWarningDiagnostic(range: Range, message: string) {
    const warningDiagnostic = new Diagnostic(range, message, DiagnosticSeverity.Warning);
    return warningDiagnostic;
  }

  updateDiagnostics(uri: Uri, diagnostics: Diagnostic[]) {
    this.diagnosticCollection.set(uri, diagnostics);
  }
}

export default DiagnosticProvider;
