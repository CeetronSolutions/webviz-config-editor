const path = require("path");
const webpack = require("webpack"); //to access built-in plugins
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");
const dotenv = require("dotenv");

const packagejson = require("./package.json");
const libraryName = packagejson.name.replace(/[-\/]/g, "_").replace(/@/g, "");

const APP_DIR = path.resolve(__dirname, "./src");
const MONACO_DIR = path.resolve(__dirname, "./node_modules/monaco-editor");

module.exports = (env, argv) => {
    const overrides = module.exports || {};

    // Mode
    let mode;
    if (argv && argv.mode) {
        mode = argv.mode;
    } else if (overrides.mode) {
        mode = overrides.mode;
    } else {
        mode = "production";
    }

    // Entry
    const entry = {
        main: argv && argv.entry ? argv.entry : "./dist/index.js",
    };

    // Output
    const filenameJs = `${libraryName}.${mode === "development" ? "dev" : "min"}.js`;
    const filenameCss = `${libraryName}.css`;

    // Devtool
    const devtool = argv.devtool || (mode === "development" ? "eval-source-map" : false);

    // Dotenv environment variables
    const envVars = dotenv.config().parsed;

    const envKeys = Object.keys(envVars).reduce((prev, next) => {
        prev[`process.env.${next}`] = JSON.stringify(envVars[next]);
        return prev;
    }, {});

    // NOTE: Keep order of the following configuration output
    // See: https://webpack.js.org/configuration/
    return {
        mode: mode,
        entry,
        output: {
            path: path.resolve(__dirname, "build"),
            filename: filenameJs,
            library: {
                type: "window",
                name: libraryName,
            },
            publicPath: "/",
        },
        devServer: {
            historyApiFallback: true,
        },
        module: {
            rules: [
                {
                    test: /\.jsx?$/,
                    exclude: /node_modules/,
                    use: "babel-loader",
                },
                {
                    test: /\.tsx?$/,
                    exclude: /node_modules/,
                    use: ["babel-loader", "ts-loader"],
                },
                {
                    test: /\.ttf$/,
                    use: ["file-loader"],
                },
                {
                    test: /\.css$/,
                    include: APP_DIR,
                    use: [
                        {
                            loader: mode === "production" ? MiniCssExtractPlugin.loader : "style-loader",
                        },
                        {
                            loader: "css-loader",
                            options: {
                                modules: true,
                                namedExport: true,
                            },
                        },
                    ],
                },
                {
                    test: /\.css$/,
                    include: MONACO_DIR,
                    use: ["style-loader", "css-loader"],
                },
                {
                    test: /\.(png|jpg|jpeg|gif)$/i,
                    use: {
                        loader: "url-loader",
                    },
                },
                {
                    test: /\.svg$/,
                    use: {
                        loader: "@svgr/webpack",
                        options: {
                            svgo: false,
                        },
                    },
                },
            ],
        },
        resolve: {
            extensions: [".ts", ".tsx", ".js", ".jsx"],
            fallback: {
                child_process: false,
                fs: false,
            },
        },
        devtool: devtool,
        plugins: [
            new MonacoWebpackPlugin({
                languages: ["yaml"],
            }),
            new webpack.ProvidePlugin({
                process: "process/browser",
            }),
            new MiniCssExtractPlugin({
                filename: filenameCss,
            }),
            new HtmlWebpackPlugin({
                filename: path.resolve(__dirname, "build", "index.html"),
                template: path.resolve(__dirname, "public", "index.html"),
                inject: true,
                favicon: path.resolve(__dirname, "public", "favicon.ico"),
            }),
            new CopyWebpackPlugin({
                patterns: [
                    {
                        from: "public",
                        globOptions: {
                            ignore: ["**.html"],
                        },
                    },
                ],
            }),
            new webpack.IgnorePlugin({ resourceRegExp: /(fs|child_process)/ }),
            new webpack.DefinePlugin(envKeys),
        ],
        optimization: {
            minimizer: [
                () => {
                    return () => {
                        return {
                            terserOptions: {},
                        };
                    };
                },
                new CssMinimizerPlugin({}),
            ],
        },
    };
};
