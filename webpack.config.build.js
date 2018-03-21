var webpack = require('webpack');
var path = require("path");

module.exports = {
  context: path.resolve(__dirname, "src"),
  entry: "./app.js",
  resolve: {
    root: [path.join(__dirname, "bower_components")],
    extensions: ["", ".js"]
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    publicPath: "/dist/",
    filename: "bundle.js"
  },
  module: {
    preLoaders: [
      {
        test: /\.js$/, // include .js files
        exclude: /(node_modules|bower_components|lib)/,
        loader: "eslint-loader"
      }
    ],
    loaders: [{
      test: /\.jsx?$/,
      exclude: /(node_modules|bower_components)/,
      loader: 'babel?presets[]=es2015'
    }]
  },
  eslint: {
    configFile: '.eslintrc'
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      }
    }),
    new webpack.ResolverPlugin(
      new webpack.ResolverPlugin.DirectoryDescriptionFilePlugin("bower.json", ["main"])
    )
  ]
};
