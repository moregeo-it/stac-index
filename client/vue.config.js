const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

module.exports = {
	// Just needed for STAC browser
	runtimeCompiler: true,
  configureWebpack: {
    plugins: [
      new NodePolyfillPlugin({
        includeAliases: ['url']
      })
    ]
  },
}