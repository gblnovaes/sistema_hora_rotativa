/**
 * Conventional Commits. Mensagens curtas, em inglês, sem ambiguidade.
 * Escopos sugeridos espelham as camadas e áreas do projeto.
 */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'refactor', 'test', 'docs', 'chore', 'build', 'ci', 'perf', 'style', 'revert'],
    ],
    'scope-enum': [
      2,
      'always',
      ['domain', 'application', 'infrastructure', 'presentation', 'main', 'preload', 'shared', 'ui', 'ci', 'deps', 'release'],
    ],
    'subject-case': [2, 'always', 'lower-case'],
    'header-max-length': [2, 'always', 72],
  },
};
