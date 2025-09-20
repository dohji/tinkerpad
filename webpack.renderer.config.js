const rules = require('./webpack.rules');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');

rules.push({
  test: /\.css$/,
  use: [
    { loader: 'style-loader' },
    { loader: 'css-loader' },
    { loader: 'postcss-loader' }
  ],
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
        new CopyWebpackPlugin({
          patterns: [
            {
              from: path.resolve(__dirname, 'src/sandbox.html'),
              to: path.resolve(__dirname, '.webpack/renderer/main_window'), 
            },
          ],
        }),
        new CopyWebpackPlugin({
          patterns: [
            {
              from: path.resolve(__dirname, 'assets'),
              to: 'assets'
            }
          ]
        })
    ]
};