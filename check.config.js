/** @type {import('project-check').Config} */
module.exports = {
  root: '.', // project root relative to where this config lives

  structure: {
    required: [
      'src/app.ts',
      'src/server.ts',
      'src/config/env.ts',
      'src/config/prisma.ts',
      'src/routes/index.ts',
      'src/controllers/',
      'src/services/',
      'src/middlewares/',
      'src/utils/',
      'src/types/',
      'prisma/schema.prisma',
      '.env.example',
      'tsconfig.json',
    ],
    forbidden: [
      'src/**/*.js', // no plain JS in a TS project
    ],
  },

  consoleLogs: {
    include: ['src/**/*.{ts,js}'],
    exclude: ['**/*.test.*', '**/*.spec.*'],
  },

  eslint: {
    extensions: ['.ts', '.js'],
    patterns: ['src/**'],
  },

  deadImports: {
    include: ['src/**/*.{ts,js}'],
  },
};
