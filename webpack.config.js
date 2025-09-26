const path = require('path');

module.exports = {
  entry: './src/index.js', // main entry point
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: './', // relative path so index.html finds main.js
  },
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.js$/, // transpile modern JS
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'], // modern JS → ES5
          },
        },
      },
      {
        test: /\.css$/, // handle CSS imports
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpg|gif|svg)$/, // handle images
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
              outputPath: 'images/',
            },
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.js'],
  },
};
