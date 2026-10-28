const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Monorepo root directory
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [monorepoRoot];

// 2. Let Metro resolve modules from workspace packages and root node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. Force Metro to resolve symlinks
config.resolver.disableHierarchicalLookup = false;
// Shared hooks must use the mobile app's React 18 runtime.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react' || moduleName.startsWith('react/')) {
    return { filePath: require.resolve(moduleName, { paths: [projectRoot] }), type: 'sourceFile' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

