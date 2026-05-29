'use strict'

const path = require('path')
const autoprefixer = require('autoprefixer')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

module.exports = {
  mode: 'development',
  entry: {
    main: './src/js/main.js',
    gamblersRuin: './src/js/gamblers-ruin.js',
    compoundInterest: './src/js/compound-interest.js',
    growthComparison: './src/js/growth-comparison.js'
  },
  output: {
    filename: '[name].js',
    chunkFilename: '[name].js',
    path: path.resolve(__dirname, 'dist')
  },
  optimization: {
    splitChunks: {
      chunks: 'all'
    }
  },
  devServer: {
    static: path.resolve(__dirname, 'dist'),
    port: 8080,
    hot: true
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      chunks: ['main', 'gamblersRuin']
    }),
    new HtmlWebpackPlugin({
      filename: 'compound-interest.html',
      template: './src/compound-interest.html',
      chunks: ['main', 'compoundInterest']
    }),
    new HtmlWebpackPlugin({
      filename: 'growth-comparison.html',
      template: './src/growth-comparison.html',
      chunks: ['main', 'growthComparison']
    }),
    new MiniCssExtractPlugin({ filename: 'main.css' }),
    new CopyWebpackPlugin({
      patterns: [
          { from: 'src/asset' }
      ]
    })
  ],
  module: {
    rules: [
      {
        test: /\.(scss)$/,
        use: [
          {
            // Emits CSS as a real file so it can load before the JS bundle.
            loader: MiniCssExtractPlugin.loader
          },
          {
            // Interprets `@import` and `url()` like `import/require()` and will resolve them
            loader: 'css-loader'
          },
          {
            // Loader for webpack to process CSS with PostCSS
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  autoprefixer
                ]
              }
            }
          },
          {
            // Loads a SASS/SCSS file and compiles it to CSS
            loader: 'sass-loader',
            options: {
              sassOptions: {
                silenceDeprecations: [
                  'color-functions',
                  'global-builtin',
                  'import',
                  'if-function'
                ]
              }
            }
          }
        ]
      }
    ]
  }
}
