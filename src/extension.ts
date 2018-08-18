'use strict';

import * as vscode from 'vscode';
import * as https from 'https';
import * as languages from './languages.json';
import { URL } from 'url';

const timeRegex = /^([+\-]?)(\d{2}):(\d{2}):(\d{2})[,.](\d{3})$/;
const timeMappingRegex = /^\d{2}:\d{2}:\d{2}[,.]\d{3} -> \d{2}:\d{2}:\d{2}[,.]\d{3}$/;
const timelineRegex = /^\d{2}:\d{2}:\d{2}[,.]\d{3} --> \d{2}:\d{2}:\d{2}[,.]\d{3}$/;
const doNotTranslateRegex = /^(?:\s*|(\d+)|\d{2}:\d{2}:\d{2}[,.]\d{3} --> \d{2}:\d{2}:\d{2}[,.]\d{3})$/;

function parseTime(value: string): number {
	if (!value) {
		return 0;
	}
	const match = value.match(timeRegex);
	if (!match) {
		return 0;
	}

	return (match[1] === '-' ? -1 : 1) * (Number(match[2]) * 60 * 60 + Number(match[3]) * 60 + Number(match[4]) + Number(match[5]) / 1000);
}

function pad2(value: number): string {
	return value < 10 ? '0' + String(value) : String(value);
}

function pad3(value: number): string {
	if (value < 10) {
		return '00' + String(value);
	} else if (value < 100) {
		return '0' + String(value);
	} else {
		return String(value);
	}
}

function formatTime(value: number): string {
	const hours = Math.floor(value / (60 * 60));
	value -= hours * 60 * 60;
	const minutes = Math.floor(value / 60);
	value -= minutes * 60;
	const seconds = Math.floor(value);
	value -= seconds;
	const milliseconds = Math.round(value * 1000);
	return (value < 0 ? '-' : '') + pad2(hours) + ':' + pad2(minutes) + ':' + pad2(seconds) + ',' + pad3(milliseconds);
}

async function shift() {
	const textEditor = vscode.window.activeTextEditor;

	if (typeof textEditor === 'undefined') {
		return false;
	}

	const inputBox = {
		placeHolder: 'Time shift',
		prompt: 'Enter the desired time shift. Use negative value if subtitles are late.',
		value: '00:00:00,000',
		valueSelection: [6, 8] as [number, number],
		validateInput: async (value: string) => timeRegex.test(value) ? null : 'Time has to be in format ±00:00:00,000.'
	};

	const value = await vscode.window.showInputBox(inputBox);

	if (typeof value === 'undefined') {
		return false;
	}

	const offset = parseTime(value);
	const workspaceEdit = new vscode.WorkspaceEdit();
	const documentUri = textEditor.document.uri;
	const selections = !textEditor.selection.isEmpty
		? textEditor.selections
		: [new vscode.Selection(textEditor.document.positionAt(0), textEditor.document.lineAt(textEditor.document.lineCount - 1).range.end)];

	for (const selection of selections) {
		for (let lineIndex = selection.start.line; lineIndex <= selection.end.line; ++lineIndex) {
			const line = textEditor.document.lineAt(lineIndex);
			if (timelineRegex.test(line.text)) {
				const timeline = line.text.split(' --> ')
					.map(x => formatTime(parseTime(x) + offset));
				workspaceEdit.replace(documentUri, line.range, timeline.join(' --> '));
			}
		}
	}

	await vscode.workspace.applyEdit(workspaceEdit);

	return true;
}

function findFirstTime(textDocument: vscode.TextDocument, lineNumbers: number[]) {
	for (const lineNumber of lineNumbers) {
		const line = textDocument.lineAt(lineNumber);
		if (timelineRegex.test(line.text)) {
			const timeline = line.text.split(' --> ');
			return timeline[0];
		}
	}
	return null;
}

async function linearCorrection() {
	const textEditor = vscode.window.activeTextEditor;

	if (typeof textEditor === 'undefined') {
		return false;
	}

	const keys = Array.from(Array(textEditor.document.lineCount).keys());
	const firstTime = findFirstTime(textEditor.document, keys) || '00:00:00,000';
	const secondTime = findFirstTime(textEditor.document, keys.reverse()) || '00:00:00,000';

	const firstInputBox = {
		placeHolder: 'Time #1',
		prompt: 'Enter first time for subtitle that appears early in the video in format old time -> correct time.',
		value: `${firstTime} -> ${firstTime}`,
		valueSelection: [16, 28] as [number, number],
		validateInput: async (value: string) => timeMappingRegex.test(value) ? null : 'Time has to be in format 00:00:00,000 -> 00:00:00,000.'
	};

	const secondInputBox = {
		...firstInputBox,
		placeHolder: 'Time #2',
		prompt: 'Enter second time for subtitle that appears late in the video in format old time -> correct time.',
		value: `${secondTime} -> ${secondTime}`,
	};

	const firstValue = await vscode.window.showInputBox(firstInputBox);
	if (typeof firstValue === 'undefined') {
		return false;
	}

	const secondValue = await vscode.window.showInputBox(secondInputBox);
	if (typeof secondValue === 'undefined') {
		return false;
	}

	const firstMapping = firstValue.split(' -> ').map(parseTime);
	const secondMapping = secondValue.split(' -> ').map(parseTime);

	const workspaceEdit = new vscode.WorkspaceEdit();
	const documentUri = textEditor.document.uri;
	const selections = !textEditor.selection.isEmpty
		? textEditor.selections
		: [new vscode.Selection(textEditor.document.positionAt(0), textEditor.document.lineAt(textEditor.document.lineCount - 1).range.end)];
	const factor = (secondMapping[1] - firstMapping[1]) / (secondMapping[0] - firstMapping[0]);

	for (const selection of selections) {
		for (let lineIndex = selection.start.line; lineIndex <= selection.end.line; ++lineIndex) {
			const line = textEditor.document.lineAt(lineIndex);
			if (timelineRegex.test(line.text)) {
				const timeline = line.text.split(' --> ').map(x => formatTime((parseTime(x) - firstMapping[0]) * factor + firstMapping[1]));
				workspaceEdit.replace(documentUri, line.range, timeline.join(' --> '));
			}
		}
	}

	await vscode.workspace.applyEdit(workspaceEdit);

	return true;
}

async function translate() {
	const textEditor = vscode.window.activeTextEditor;

	if (typeof textEditor === 'undefined') {
		return false;
	}
	const languagesByCode = languages as { [code: string]: string };
	const items = Object.keys(languagesByCode)
		.map(code => ({
			label: `${languagesByCode[code]}`,
			detail: code
		}));

	const quickPickOpts: vscode.QuickPickOptions = {
		placeHolder: 'Language',
		matchOnDetail: true
	};

	const value = await vscode.window.showQuickPick(items, quickPickOpts);

	if (typeof value === 'undefined') {
		return false;
	}

	const language = value.detail;

	const workspaceEdit = new vscode.WorkspaceEdit();
	const documentUri = textEditor.document.uri;
	const selections = !textEditor.selection.isEmpty
		? textEditor.selections
		: [new vscode.Selection(textEditor.document.positionAt(0), textEditor.document.lineAt(textEditor.document.lineCount - 1).range.end)];

	const originalLines: string[] = [];
	const lineIndexes: number[] = [];
	for (const selection of selections) {
		for (let lineIndex = selection.start.line; lineIndex <= selection.end.line; ++lineIndex) {
			const line = textEditor.document.lineAt(lineIndex);
			if (!doNotTranslateRegex.test(line.text)) {
				originalLines.push(line.text);
				lineIndexes.push(lineIndex);
			}
		}
	}

	const translatedLines = await translateLines(language, originalLines);
	while (true) {
		const lineIndex = lineIndexes.shift();
		const translatedLine = translatedLines.shift();
		if (lineIndex === undefined || translatedLine === undefined) {
			break;
		}
		const line = textEditor.document.lineAt(lineIndex);
		workspaceEdit.replace(documentUri, line.range, translatedLine);
	}

	await vscode.workspace.applyEdit(workspaceEdit);

	return true;
}

async function translateText(language: string, text: string): Promise<string> {
	const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(language)}&dt=t&q=${encodeURIComponent(text)}`;
	const json = JSON.parse(await httpGet(url));
	return json[0].map((x: any[]) => x[0]).join('');
}

async function translateLines(language: string, originalLines: string[]): Promise<string[]> {
	const result: string[] = [];
	const lines: string[] = [];
	let length = 0;
	for (const originalLine of originalLines) {
		if (length + originalLine.length + 1 > 5000) {
			const translatedText = await translateText(language, lines.join('\n'));
			Array.prototype.push.apply(result, translatedText.split('\n'));
			lines.length = 0;
			length = 0;
		}
		lines.push(originalLine);
		length += originalLine.length + 1;
	}
	const translatedText = await translateText(language, lines.join('\n'));
	Array.prototype.push.apply(result, translatedText.split('\n'));
	return result.map(x => x.replace(/(<)(\/?)\s*([bi])\s*(>)/gi, '$1$2$3$4'));
}

async function httpGet(url: string): Promise<string> {
	return new Promise<string>((resolve, reject) => {
		const uri = new URL(url);
		const opts = {
			hostname: uri.hostname,
			port: uri.port || 443,
			path: uri.pathname + uri.search,
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.110 Safari/537.36'
			}
		};
		https.get(opts, res => {
			if (res.statusCode !== 200) {
				reject(new Error(``));
			}
			let body = '';
			res.on('data', d => body += d);
			res.on('end', () => resolve(body));
		});
	});
}

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.commands.registerCommand('extension.shift', shift));
	context.subscriptions.push(vscode.commands.registerCommand('extension.linearCorrection', linearCorrection));
	context.subscriptions.push(vscode.commands.registerCommand('extension.translate', translate));
}

export function deactivate() {
}
