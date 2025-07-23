import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createOnigScanner, createOnigString, loadWASM } from 'vscode-oniguruma';
import { parseRawGrammar, Registry } from 'vscode-textmate';

const GRAMMAR_PATH = path.resolve(__dirname, '../../../../syntaxes/regex-match.tmLanguage.json');

export async function createRegistry() {
  const wasmPath = require.resolve('vscode-oniguruma/release/onig.wasm');
  const wasmBin = await readFile(wasmPath);

  // Inicializa o oniguruma com WASM
  await loadWASM(wasmBin);

  // Cria o registry do TextMate
  const registry = new Registry({
    onigLib: Promise.resolve({
      createOnigScanner,
      createOnigString,
    }),
    loadGrammar: async (scopeName) => {
      if (scopeName === 'source.rgx') {
        const content = await readFile(GRAMMAR_PATH, 'utf-8');
        return parseRawGrammar(content, GRAMMAR_PATH);
      }
      return null;
    },
  });

  return registry;
}
