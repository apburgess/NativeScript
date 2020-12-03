import { DefinePlugin, HotModuleReplacementPlugin } from 'webpack';
import Config from 'webpack-chain';

import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';

// import { WatchStateLoggerPlugin } from '../plugins/WatchStateLoggerPlugin';
import { PlatformSuffixPlugin } from '../plugins/PlatformSuffixPlugin';
import { addCopyRule, applyCopyRules } from '../helpers/copyRules';
import { WatchStatePlugin } from '../plugins/WatchStatePlugin';
import { hasDependency } from '../helpers/dependencies';
import { IWebpackEnv } from '../index';
import {
	getAbsoluteDistPath,
	getEntryDirPath,
	getEntryPath,
	getPlatform,
} from '../helpers/project';

export default function (config: Config, env: IWebpackEnv): Config {
	const entryPath = getEntryPath();
	const platform = getPlatform();
	const mode = env.production ? 'production' : 'development';

	// set mode
	config.mode(mode);

	// config.stats({
	// 	logging: 'verbose'
	// })

	// package.json is generated by the CLI with runtime options
	// this ensures it's not included in the bundle, but rather
	// resolved at runtime
	config.externals(['package.json', '~/package.json']);

	// todo: devtool
	config.devtool('inline-source-map');

	// todo: figure out easiest way to make "node" target work in ns
	// rather than the custom ns target implementation that's hard to maintain
	// appears to be working - but we still have to deal with HMR
	config.target('node');

	config
		.entry('bundle')
		// ensure we load nativescript globals first
		.add('@nativescript/core/globals/index.js')
		.add(entryPath);

	// inspector_modules
	config.when(shouldIncludeInspectorModules(env), (config) => {
		config
			.entry('tns_modules/@nativescript/core/inspector_modules')
			.add('@nativescript/core/inspector_modules');
	});

	config.output
		.path(getAbsoluteDistPath())
		.pathinfo(false)
		.publicPath('')
		.libraryTarget('commonjs')
		.globalObject('global');

	// Set up Terser options
	config.optimization.minimizer('TerserPlugin').use(TerserPlugin, [
		{
			terserOptions: {
				compress: {
					collapse_vars: platform !== 'android',
					sequences: platform !== 'android',
				},
				// todo: move into vue.ts if not required in other flavors?
				keep_fnames: true,
			},
		},
	]);

	config.optimization.splitChunks({
		cacheGroups: {
			defaultVendor: {
				test: /[\\/]node_modules[\\/]/,
				priority: -10,
				name: 'vendor',
				chunks: 'all',
			},
		},
	});

	// look for loaders in
	//  - node_modules/@nativescript/webpack/dist/loaders
	//  - node_modules
	// allows for cleaner rules, without having to specify full paths to loaders
	config.resolveLoader.modules
		.add('node_modules/@nativescript/webpack/dist/loaders')
		.add('node_modules');

	config.resolve.extensions
		.add(`.${platform}.ts`)
		.add('.ts')
		.add(`.${platform}.js`)
		.add('.js')
		.add(`.${platform}.css`)
		.add('.css')
		.add(`.${platform}.scss`)
		.add('.scss')
		.add(`.${platform}.json`)
		.add('.json');

	// base aliases
	config.resolve.alias.set('~', getEntryDirPath()).set('@', getEntryDirPath());

	// resolve symlinks
	config.resolve.symlinks(true);

	// set up ts support
	config.module
		.rule('ts')
		.test([/\.ts$/])
		.use('ts-loader')
		.loader('ts-loader')
		.options({
			// todo: perhaps we can provide a default tsconfig
			// and use that if the project doesn't have one?
			// configFile: '',
			transpileOnly: true,
			allowTsInNodeModules: true,
			compilerOptions: {
				sourceMap: true,
				declaration: false,
			},
			getCustomTransformers() {
				return {
					before: [require('../transformers/NativeClass').default],
				};
			},
		});

	// Use Fork TS Checker to do type checking in a separate non-blocking process
	config.when(hasDependency('typescript'), (config) => {
		config
			.plugin('ForkTsCheckerWebpackPlugin')
			.use(ForkTsCheckerWebpackPlugin, [
				{
					typescript: {
						memoryLimit: 4096,
					},
				},
			]);
	});

	// set up js
	// todo: do we need babel-loader? It's useful to support it
	config.module
		.rule('js')
		.test(/\.js$/)
		.exclude.add(/node_modules/)
		.end()
		.use('babel-loader')
		.loader('babel-loader')
		.options({
			generatorOpts: {
				compact: false,
			},
		});

	// default PostCSS options to use
	// projects can change settings
	// via postcss.config.js
	const postCSSOptions = {
		postcssOptions: {
			plugins: [
				// inlines @imported stylesheets
				'postcss-import',
			],
		},
	};

	// set up css
	config.module
		.rule('css')
		.test(/\.css$/)
		.use('apply-css-loader')
		.loader('apply-css-loader')
		.end()
		.use('css2json-loader')
		.loader('css2json-loader')
		.end()
		.use('postcss-loader')
		.loader('postcss-loader')
		.options(postCSSOptions);

	// set up scss
	config.module
		.rule('scss')
		.test(/\.scss$/)
		.use('apply-css-loader')
		.loader('apply-css-loader')
		.end()
		.use('css2json-loader')
		.loader('css2json-loader')
		.end()
		.use('postcss-loader')
		.loader('postcss-loader')
		.options(postCSSOptions)
		.end()
		.use('sass-loader')
		.loader('sass-loader');

	// items to clean
	config.plugin('CleanWebpackPlugin').use(CleanWebpackPlugin, [
		{
			cleanOnceBeforeBuildPatterns: [`${getAbsoluteDistPath()}/**/*`],
			verbose: !!env.verbose,
		},
	]);

	// config.plugin('NormalModuleReplacementPlugin').use(NormalModuleReplacementPlugin, [
	// 	/.*/,
	// 	request => {
	// 		if (new RegExp(`\.${platform}\..+$`).test(request.request)) {
	// 			request.rawRequest = request.rawRequest.replace(`.${platform}.`, '.')
	// 			console.log(request)
	// 		}
	// 	}
	// ])

	config.plugin('PlatformSuffixPlugin').use(PlatformSuffixPlugin, [
		{
			platform,
		},
	]);

	// todo: refine defaults
	config.plugin('DefinePlugin').use(DefinePlugin, [
		{
			__DEV__: mode === 'development',
			__NS_WEBPACK__: true,
			__CSS_PARSER__: JSON.stringify('css-tree'), // todo: replace from config value
			__ANDROID__: platform === 'android',
			__IOS__: platform === 'ios',
			/* for compat only */ 'global.isAndroid': platform === 'android',
			/* for compat only */ 'global.isIOS': platform === 'ios',
			process: 'global.process',

			// todo: ?!?!
			// profile: '() => {}',
		},
	]);

	// set up default copy rules
	addCopyRule('assets/**');
	addCopyRule('fonts/**');
	addCopyRule('**/*.+(jpg|png)');

	applyCopyRules(config);

	// add the WatchStateLogger plugin used to notify the CLI of build state
	// config.plugin('WatchStateLoggerPlugin').use(WatchStateLoggerPlugin);
	config.plugin('WatchStatePlugin').use(WatchStatePlugin);

	config.when(env.hmr, (config) => {
		config.plugin('HotModuleReplacementPlugin').use(HotModuleReplacementPlugin);
	});

	config.when(env.report, (config) => {
		config.plugin('BundleAnalyzerPlugin').use(BundleAnalyzerPlugin);
	});

	return config;
}

function shouldIncludeInspectorModules(env: IWebpackEnv): boolean {
	const platform = getPlatform();
	// todo: check if core modules are external
	// todo: check if we are testing
	return platform === 'ios';
}
