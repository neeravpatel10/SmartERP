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

// Add devServer configuration
module.exports.devServer = function(configFunction) {
  return function(proxy, allowedHost) {
    const config = configFunction(proxy, allowedHost);
    // Change allowedHosts to allow all hosts
    config.allowedHosts = 'all';
    return config;
  };
}; 