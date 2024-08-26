import CopyPlugin from "copy-webpack-plugin";
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';


export const plugins = [
  new CopyPlugin({
    patterns: [
        { from: 'src/Models/best.onnx', to: 'model.onnx' },
    ]
  }),
  new ForkTsCheckerWebpackPlugin({
    logger: 'webpack-infrastructure',
  }),
];
