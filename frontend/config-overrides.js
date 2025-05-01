// This file is used to customize the Create React App webpack configuration
module.exports = function override(config, env) {
  // Fix for MUI module resolution errors
  config.module.rules.push({
    test: /\.(js|mjs|jsx)$/,
    include: /node_modules(\/|\\)(@mui|@emotion)/,
    resolve: {
      fullySpecified: false
    }
  });

  // Add extensions resolution for @mui packages
  if (!config.resolve) {
    config.resolve = {};
  }
  if (!config.resolve.extensionAlias) {
    config.resolve.extensionAlias = {};
  }
  config.resolve.extensionAlias['.js'] = ['.js', '.jsx', '.ts', '.tsx'];

  return config;
}; 