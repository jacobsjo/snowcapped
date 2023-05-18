const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin')
const LicenseWebpackPlugin = require('license-webpack-plugin').LicenseWebpackPlugin;
const webpack = require('webpack');


module.exports = {
    entry: {
        bundle: './src/main/app.ts',
        multinoiseworker: './src/multinoiseworker/worker.ts',
        "service-worker": './src/service-worker/service-worker.ts'
    },
    module: {
        rules: [{
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /node_modules/,
        },
        {
            test: /\.glsl$/,
            loader: 'webpack-glsl-loader'
        } 
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        fallback: {
            buffer: require.resolve("buffer/")
        }
    },
    performance: {
        hints: false,
        maxEntrypointSize: 512000,
        maxAssetSize: 512000
    },    
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                { from: 'public', to: '' }
            ]
        })
    ],
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist'),
        clean: true
    }
};