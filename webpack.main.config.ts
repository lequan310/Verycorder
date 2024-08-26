import type { Configuration } from 'webpack';

import { rules } from './webpack.rules';
import { plugins } from './webpack.plugins';
import nodeExternals from 'webpack-node-externals';

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
