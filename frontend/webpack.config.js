const HtmlWebpackPlugin = require('html-webpack-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const path = require('path');

module.exports = (env, argv) => {
  const isDevelopment = argv.mode === 'development';

  return {
    entry: './src/index.tsx',
    mode: isDevelopment ? 'development' : 'production',
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: [
            {
              loader: 'babel-loader',
              options: {
                plugins: isDevelopment
                  ? [
                      isDevelopment && 'babel-plugin-styled-components',
                      isDevelopment && 'react-refresh/babel',
                    ]
                  : [],
              },
            },
            'ts-loader',
          ],
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
      filename: 'bundle.[contenthash].js',
      path: path.resolve(__dirname, 'dist'),
      clean: true,
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: 'src/index.html',
      }),
      isDevelopment && new ReactRefreshWebpackPlugin(),
    ].filter(Boolean),
    devServer: isDevelopment
      ? {
          static: {
            directory: path.join(__dirname, 'dist'),
          },
          compress: true,
          port: 9000,
          historyApiFallback: true,
          hot: true,
        }
      : undefined,
  };
};
