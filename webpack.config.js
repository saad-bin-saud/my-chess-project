const path = require('path');

module.exports = {
  entry: './src/index.js', // main entry point for your app
  output: {
    filename: 'main.js', // bundled file name
    path: path.resolve(__dirname, 'dist'), // output folder
    publicPath: 'dist/', // ensures index.html can find main.js correctly
  },
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.css$/, // handle CSS imports
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpg|gif|svg)$/, // handle images (like chess pieces if local)
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
              outputPath: 'image/',
            },
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.js'], // resolve .js files automatically
  },
};
