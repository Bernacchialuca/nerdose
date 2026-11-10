import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

const APPS = ['web', 'admin', 'api', 'generator'];

const REACT_FILES = [
  'apps/web/**/*.{ts,tsx}',
  'apps/admin/**/*.{ts,tsx}',
  'packages/ui/**/*.{ts,tsx}',
  'packages/games/*/src/client/**/*.{ts,tsx}',
];

const noDb = {
  group: ['@nerdose/db', '@nerdose/db/*'],
  message: 'Frontends never import the database package.',
};
const frontendsOnlyClient = {
  group: ['@nerdose/game-*/definition', '@nerdose/game-*/generator', '@nerdose/polyglot'],
  message: 'Frontends import only ./client.',
};

// Matches only imports that enter the src/ of another app, so a module-level `api/`
// folder inside web does not trigger a false positive.
const crossApp = (self) => ({
  group: APPS.filter((app) => app !== self).flatMap((app) => [
    `**/${app}/src/**`,
    `**/apps/${app}/**`,
  ]),
  message: 'Apps never import from other apps.',
});

// In flat config a later block replaces the options of an earlier one for the same rule,
// so each file group gets a single no-restricted-imports that composes all of its patterns.
const restrict = (patterns) => ({ 'no-restricted-imports': ['error', { patterns }] });

export default [
  { ignores: ['**/dist/**', '**/.turbo/**'] },
  ...tseslint.configs.recommended,
  { ...jsxA11y.flatConfigs.recommended, files: REACT_FILES },
  { ...reactHooks.configs.flat.recommended, files: REACT_FILES },
  {
    files: ['apps/web/**'],
    rules: restrict([noDb, frontendsOnlyClient, crossApp('web')]),
  },
  {
    files: ['apps/admin/**'],
    rules: restrict([noDb, frontendsOnlyClient, crossApp('admin')]),
  },
  {
    files: ['apps/api/**'],
    rules: restrict([
      {
        group: ['@nerdose/game-*/client', '@nerdose/game-*/generator', '@nerdose/polyglot'],
        message: 'api imports only ./definition.',
      },
      crossApp('api'),
    ]),
  },
  {
    files: ['apps/generator/**'],
    rules: restrict([
      {
        group: ['@nerdose/game-*/client'],
        message: 'generator imports ./generator (and ./definition if needed).',
      },
      crossApp('generator'),
    ]),
  },
  {
    files: ['packages/games/*/src/{definition,client}/**'],
    rules: restrict([
      {
        group: ['@nerdose/game-*/generator', '@nerdose/polyglot', 'node:child_process'],
        message: 'definition and client never import code that executes.',
      },
    ]),
  },
  {
    files: ['packages/core/src/**'],
    rules: restrict([
      {
        group: ['node:*'],
        message: 'The core entry is isomorphic: no node:*.',
      },
    ]),
  },
  {
    files: ['packages/ui/**'],
    rules: restrict([noDb]),
  },
];
