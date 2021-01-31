const path = require('path');
const WebpackShellPluginNext = require('webpack-shell-plugin-next');
let pkg = require('./package.json');
const fs = require('fs');

module.exports = {
    plugins: [
        new WebpackShellPluginNext({
            onBuildEnd: {
                scripts: [
                    () => {
                        const scriptHeader = fs.readFileSync('src/scriptHeader.js', 'utf-8');
                        const builtScriptContents = fs.readFileSync('dist/index.js', 'utf-8');

                        const updatedHeader = scriptHeader
                            .replace('__VERSION__', pkg.version)
                            .replace('__DESCRIPTION__', pkg.description);

                        const userscriptContents = updatedHeader + "\n\n" + builtScriptContents;

                        fs.writeFileSync('dist/userscript.js', userscriptContents);
                    },
                    'rm dist/index.js'
                ],
                blocking: true,
                parallel: false
            }
        })
    ],
    entry: {
        index: './src/index.js'
    },
    output: {
        filename: 'index.js',
        path: path.resolve(__dirname, 'dist'),
    },
    optimization: {
        minimize: false
    },
    mode: 'production',
    module: {
        rules: [
            {
                test: /\.(css|svg|html)$/i,
                use: 'raw-loader',
            },
        ],
    }
};