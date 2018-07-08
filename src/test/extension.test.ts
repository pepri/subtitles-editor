
import * as assert from 'assert';

// import * as vscode from 'vscode';
// import * as myExtension from '../extension';

suite("Extension Tests", function () {
	test("Something 1", function() {
		assert.equal(-1, [1, 2, 3].indexOf(5));
		assert.equal(-1, [1, 2, 3].indexOf(0));
	});
});
