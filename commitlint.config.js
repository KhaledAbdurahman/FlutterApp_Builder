export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'chore'],
    ],
    'type-case': [2, 'always', ['lower-case', 'upper-case', 'camel-case', 'pascal-case']],
    'scope-empty': [2, 'never'],
    'scope-enum': [
      2,
      'always',
      [
        'config',
        'style',
        'struct',
        'tooling',
        'shared',
        'eslint',
        'landing',
        'auth',
        'dashboard',
        'builder',
        'project',
        'livePrev',
      ],
    ],
    'scope-case': [2, 'always', ['lower-case', 'upper-case', 'camel-case', 'pascal-case']],
    'subject-case': [2, 'always', ['lower-case', 'upper-case', 'camel-case', 'pascal-case']],
    'body-case': [2, 'always', ['lower-case', 'upper-case', 'camel-case', 'pascal-case']],
  },
};
