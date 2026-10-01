import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    // Parallel Codex files (docs/CONCURRENT_WORK.md) are not part of this app.
    ignores: ['dist', 'dev-dist', 'node_modules', 'semiogarde', 'tests', 'playwright.config.ts', 'src/app/App.tsx', 'src/app/Pages.tsx', 'src/app/backup.ts', 'src/app/store.ts', 'src/audio/**', 'src/db/index.ts', 'src/features/editor/**', 'src/ui/Icon.tsx'],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: { ecmaVersion: 2022, globals: globals.browser },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
);
