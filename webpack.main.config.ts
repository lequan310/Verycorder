import type { Configuration } from 'webpack';

const path = require('path');
import { rules } from './webpack.rules';
import { plugins } from './webpack.plugins';
const nodeExternals = require('webpack-node-externals');

export const mainConfig: Configuration = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: './src/main.ts',
  // Put your normal webpack config below here
  target: 'node',
  node: {
    __dirname: false,
  },
  // output: {
  //   path: path.resolve(__dirname, '.webpack'),
  //   filename: 'index.js',
  // },
  module: {
    rules,
  },
  plugins,
  externals: [
    nodeExternals(),
  ],
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json'],
  },
};
