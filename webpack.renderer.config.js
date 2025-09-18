const rules = require('./webpack.rules');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

rules.push({
  test: /\.css$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
});

module.exports = {
  entry: './src/renderer.js',
  module: {
    rules,
  },
    plugins: [
        new MonacoWebpackPlugin({
            languages: ['javascript', 'typescript', 'css', 'html']
        }),
    ]
};