import js from '@eslint/js';
import path from 'node:path';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import checkFile from 'eslint-plugin-check-file';
import tseslint from 'typescript-eslint';

//TODO: split the configs into different js files depending on the type of the rule

const SRC_ROOT = 'src';
const PAGE_ROOT = `${SRC_ROOT}/pages`;
const APP_ROOT = `${SRC_ROOT}/app`;
const SHARED_ROOTS = new Set([
  'api',
  'assets',
  'components',
  'config',
  'hooks',
  'lib',
  'stores',
  'types',
  'utils',
]);

const NormalizePath = (filePath) => filePath.split(path.sep).join('/');

const GetImportPath = (importSource, currentFileName) => {
  if (importSource.startsWith('@/')) {
    return `${SRC_ROOT}/${importSource.slice(2)}`;
  }

  if (importSource.startsWith('.')) {
    const currentDirectory = path.dirname(NormalizePath(currentFileName));
    return NormalizePath(path.normalize(path.join(currentDirectory, importSource)));
  }

  return null;
};

const GetPageName = (filePath) => {
  if (!filePath.startsWith(`${PAGE_ROOT}/`)) return null;

  return filePath.slice(PAGE_ROOT.length + 1).split('/')[0] || null;
};

const GetSharedRoot = (filePath) => {
  if (!filePath.startsWith(`${SRC_ROOT}/`)) return null;

  const root = filePath.slice(SRC_ROOT.length + 1).split('/')[0] || null;
  return root && SHARED_ROOTS.has(root) ? root : null;
};

const architecture = {
  rules: {
    'module-boundaries': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Enforce page-centric unidirectional imports and shared-module boundaries.',
        },
        messages: {
          crossPage:
            'Page modules cannot import from another page module. Move shared behavior to a shared folder instead.',
          sharedToApp:
            'Shared modules must not import from app/. Keep shared code below the app layer.',
          sharedToPage:
            'Shared modules must not import from pages/. Move the dependency into shared code or invert the dependency.',
        },
        schema: [],
      },
      create(context) {
        const sourceFileName = NormalizePath(context.filename);
        const sourcePageName = GetPageName(sourceFileName);
        const sourceSharedRoot = GetSharedRoot(sourceFileName);

        return {
          ImportDeclaration(node) {
            const importSource = node.source.value;

            if (typeof importSource !== 'string') return;

            const importedPath = GetImportPath(importSource, sourceFileName);

            if (!importedPath) return;

            if (sourcePageName) {
              const importedPageName = GetPageName(importedPath);

              if (importedPageName && importedPageName !== sourcePageName) {
                context.report({ node, messageId: 'crossPage' });
              }
            }

            if (sourceSharedRoot) {
              if (importedPath.startsWith(`${APP_ROOT}/`)) {
                context.report({ node, messageId: 'sharedToApp' });
              }

              if (importedPath.startsWith(`${PAGE_ROOT}/`)) {
                context.report({ node, messageId: 'sharedToPage' });
              }
            }
          },
        };
      },
    },
    'absolute-imports': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prefer @/ absolute imports inside source files.',
        },
        messages: {
          relativeImport: 'Use an @/ absolute import instead of a relative import.',
        },
        schema: [],
      },
      create(context) {
        return {
          ImportDeclaration(node) {
            const importSource = node.source.value;

            if (typeof importSource === 'string' && importSource.startsWith('.')) {
              context.report({ node, messageId: 'relativeImport' });
            }
          },
        };
      },
    },
  },
};

export default tseslint.config(
  { ignores: ['dist', 'coverage'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      architecture,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'architecture/module-boundaries': 'error',
      'architecture/absolute-imports': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/naming-convention': [
        'warn',
        {
          selector: 'typeLike',
          format: ['PascalCase'],
        },
        {
          selector: 'function',
          format: ['camelCase', 'PascalCase'],
        },
        {
          selector: 'parameter',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
        },
        {
          selector: 'variable',
          modifiers: ['const'],
          format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
          leadingUnderscore: 'allow',
        },
        {
          selector: 'variable',
          format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
          leadingUnderscore: 'allow',
        },
        {
          selector: 'objectLiteralProperty',
          format: null,
        },
        {
          selector: ['classProperty', 'typeProperty'],
          format: ['camelCase', 'snake_case', 'PascalCase', 'UPPER_CASE'],
          leadingUnderscore: 'allow',
        },
      ],
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  {
    files: [
      'src/app/**/*.{ts,tsx}',
      'src/api/**/*.{ts,tsx}',
      'src/config/**/*.{ts,tsx}',
      'src/stores/**/*.{ts,tsx}',
      'src/utils/**/*.{ts,tsx}',
    ],
    plugins: {
      'check-file': checkFile,
    },
    rules: {
      'check-file/filename-naming-convention': [
        'error',
        {
          '**/*.{ts,tsx}': 'KEBAB_CASE',
        },
      ],
      'check-file/folder-naming-convention': [
        'error',
        {
          'src/{app,api,config,stores,utils}/**/': 'KEBAB_CASE',
        },
      ],
    },
  },
);
