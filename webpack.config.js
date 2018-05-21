const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TSLintPlugin = require('tslint-webpack-plugin');
const path = require('path');
const distPath = path.join(__dirname, './build');

module.exports = {
	devtool: 'source-map',
	mode: 'development',
	entry: [
		'./src/Main.ts'
	],
	output: {
		path: distPath,
		publicPath: '/',
		filename: "bundle.js"
	},
	resolve: {
		extensions: [".ts", ".js", ".json"],
		modules: [
			path.resolve('./src'),
			path.resolve('./node_modules')
		]
	},
	module: {
		rules: [
			// Typescript
			{
				test: /\.tsx?$/,
				loader: ["awesome-typescript-loader"]
			},
			{
				enforce: "pre",
				test: /\.js$/,
				loader: "source-map-loader"
			},
			// HTML Pug Temapltes
			{
				test: /\.pug$/,
				loader: 'pug-loader'
			},
			// Stylesheets
			{
				test: /\.scss$/,
				loader: [
					'style-loader', // creates style nodes from JS strings
					'css-loader', // translates CSS into CommonJS
					'sass-loader' // compiles Sass to CSS
				]
			},
			{
				test: /\.css$/,
				loader: [
					'style-loader', // creates style nodes from JS strings
					'css-loader', // translates CSS into CommonJS
				]
			},
			// Images packaging.
			{
				test: /\.(png|jpg|gif|woff|woff2|eot|ttf|svg)$/,
				loader: ['url-loader?limit=8192']
			}
		]
	},
	plugins: [
		new CopyWebpackPlugin([
			{ from: './src/index.html', to: distPath }
		]),
		new TSLintPlugin({
			files: ['./src/**/*.ts']
		}),
		new webpack.NamedModulesPlugin(),
		new webpack.DefinePlugin({
			DEBUG: JSON.stringify(true)
		})
	],
	devServer: {
		contentBase: path.join(__dirname, "resources"),
		host: "0.0.0.0",
		index: 'index.html',
		port: 8000
	}
};
