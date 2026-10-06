const typescriptParser = require('@typescript-eslint/parser');
const typescriptPlugin = require('@typescript-eslint/eslint-plugin');

module.exports = [
	{
		ignores: ['node_modules/**', 'out/**', '.vscode-test/**']
	},
	{
		files: ['src/**/*.ts'],
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			parser: typescriptParser,
			parserOptions: {
				project: './tsconfig.json'
			}
		},
		plugins: {
			'@typescript-eslint': typescriptPlugin
		},
		rules: {
			'@typescript-eslint/naming-convention': 'warn',
			'@typescript-eslint/no-unused-expressions': 'warn',
			semi: ['warn', 'always'],
			indent: ['error', 'tab', { SwitchCase: 1 }],
			curly: 'warn',
			eqeqeq: ['warn', 'always'],
			'no-trailing-spaces': 'error',
			'no-throw-literal': 'warn'
		}
	}
];
