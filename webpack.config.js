const path = require("path");
const copyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const workboxWebpackPlugin = require("workbox-webpack-plugin");
const webpack = require("webpack");

module.exports = {
  entry: "./src/app.js",
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
  },
  devServer: {
    static: "./dist",
    port: 8008,
    open: true,
    proxy: [
      {
        context: ["/api"],
        target: "http://localhost:3000",
      },
    ],
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
        },
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./public/index.html",
    }),
    new copyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, "public/img"),
          to: "img",
        },
        {
          from: path.resolve(__dirname, "public/manifest.json"),
          to: ".",
        },
      ],
    }),
    new webpack.ProvidePlugin({
      $: "jquery",
      jQuery: "jquery",
      "window.jQuery": "jquery",
    }),
    new workboxWebpackPlugin.GenerateSW({
      clientsClaim: true,
      skipWaiting: true,
      maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB
    }),
  ],
  mode: "development",
};
