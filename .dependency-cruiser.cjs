/**
 * Regra de dependência da Clean Architecture, aplicada no CI.
 * presentation -> application -> domain
 * infrastructure -> application -> domain
 * O domínio não importa nenhuma outra camada.
 */
module.exports = {
  forbidden: [
    {
      name: 'domain-is-pure',
      comment: 'O domínio não pode importar application, infrastructure, presentation, main, preload ou shared.',
      severity: 'error',
      from: { path: '^src/domain' },
      to: { path: '^src/(application|infrastructure|renderer|main|preload|shared)' },
    },
    {
      name: 'application-no-infra-or-ui',
      comment: 'A aplicação só depende do domínio e das próprias portas, nunca de adaptadores ou UI.',
      severity: 'error',
      from: { path: '^src/application' },
      to: { path: '^src/(infrastructure|renderer|main|preload)' },
    },
    {
      name: 'renderer-no-infra',
      comment: 'O renderer (React) nunca importa infrastructure, main ou preload direto; fala por IPC.',
      severity: 'error',
      from: { path: '^src/renderer' },
      to: { path: '^src/(infrastructure|main|preload)' },
    },
    {
      name: 'no-circular',
      comment: 'Sem dependências circulares.',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'no-orphans',
      comment: 'Sem módulos órfãos (exceto tipos e configs).',
      severity: 'warn',
      from: { orphan: true, pathNot: ['\\.d\\.ts$', '(^|/)index\\.ts$'] },
      to: {},
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.node.json' },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      extensions: ['.ts', '.tsx', '.js'],
    },
  },
};
