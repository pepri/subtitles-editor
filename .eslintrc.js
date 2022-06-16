module.exports = {
	"env": {
		"es6": true,
		"node": true
	},
	"parser": "@typescript-eslint/parser",
	"parserOptions": {
		"project": "tsconfig.json",
		"sourceType": "module"
	},
	"plugins": [
		"@typescript-eslint"
	],
	"rules": {
		"@typescript-eslint/member-delimiter-style": [
			"warn",
			{
				"multiline": {
					"delimiter": "semi",
					"requireLast": true
				},
				"singleline": {
					"delimiter": "semi",
					"requireLast": false
				}
			}
		],
		"@typescript-eslint/naming-convention": "warn",
		"@typescript-eslint/no-unused-expressions": "warn",
		"@typescript-eslint/semi": [
			"warn",
			"always"
		],
		"indent": ["error", "tab", { "SwitchCase": 1 }],
		"curly": "warn",
		"eqeqeq": [
			"warn",
			"always"
		],
		"no-trailing-spaces": "error",
		"no-throw-literal": "warn"
	}
};
