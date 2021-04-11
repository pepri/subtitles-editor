'use strict';

import * as vscode from 'vscode';
import * as https from 'https';
import * as languages from './languages.json';
import { URL } from 'url';
import { Frame } from './model/Frame';
import { TimeLine } from './model/TimeLine';
import { Time, TIME_REGEX, TIME_TAG_REGEX } from './model/Time';

const sequenceRegex = /^([+\-]?)(\d+)(?=\s|$)/;
const timeMappingRegex = /^\d{2}:\d{2}:\d{2}[,.]\d{3} -> \d{2}:\d{2}:\d{2}[,.]\d{3}$/;
const doNotTranslateRegex = /^(?:\s*|(\d+)|\d{2}:\d{2}:\d{2}[,.]\d{3} --> \d{2}:\d{2}:\d{2}[,.]\d{3})$/;

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
		validateInput: async (value: string) => TIME_REGEX.test(value) ? null : 'Time has to be in format ±00:00:00,000.'
	};

	const value = await vscode.window.showInputBox(inputBox);

	if (typeof value === 'undefined') {
		return false;
	}

	const offset = Time.parse(value).value;
	const workspaceEdit = new vscode.WorkspaceEdit();
	const documentUri = textEditor.document.uri;
	const selections = !textEditor.selection.isEmpty
		? textEditor.selections
		: [new vscode.Selection(textEditor.document.positionAt(0), textEditor.document.lineAt(textEditor.document.lineCount - 1).range.end)];

	for (const selection of selections) {
		for (let lineIndex = selection.start.line; lineIndex <= selection.end.line; ++lineIndex) {
			const line = textEditor.document.lineAt(lineIndex);
			if (!line.isEmptyOrWhitespace) {
				const timeLine = TimeLine.parse(line.text);
				if (timeLine) {
					timeLine.shift(offset);
					workspaceEdit.replace(documentUri, line.range, timeLine.format());
				} else if (TIME_TAG_REGEX.test(line.text)) {
					workspaceEdit.replace(documentUri, line.range,
						line.text.replace(TIME_TAG_REGEX, (_match, text) => {
							const time = Time.parse(text);
							time.shift(offset);
							return `<${time.format()}>`;
						}));
				}
			}
		}
	}

	await vscode.workspace.applyEdit(workspaceEdit);

	return true;
}

async function renumber() {
	const textEditor = vscode.window.activeTextEditor;

	if (typeof textEditor === 'undefined') {
		return false;
	}

	const inputBox = {
		placeHolder: 'Sequence start index',
		prompt: 'Enter the start index to renumber the sequence.',
		value: '1',
		valueSelection: [0, 1] as [number, number],
		validateInput: async (value: string) => sequenceRegex.test(value) ? null : 'Offset has to be a number.'
	};

	const value = await vscode.window.showInputBox(inputBox);

	if (typeof value === 'undefined') {
		return false;
	}

	let offset = Number(value);
	const workspaceEdit = new vscode.WorkspaceEdit();
	const documentUri = textEditor.document.uri;
	const selections = !textEditor.selection.isEmpty
		? textEditor.selections
		: [new vscode.Selection(textEditor.document.positionAt(0), textEditor.document.lineAt(textEditor.document.lineCount - 1).range.end)];

	for (const selection of selections) {
		for (let lineIndex = selection.start.line; lineIndex <= selection.end.line; ++lineIndex) {
			const line = textEditor.document.lineAt(lineIndex);
			if (!line.isEmptyOrWhitespace) {
				const previousLineIsEmpty = lineIndex === 0 || textEditor.document.lineAt(lineIndex - 1).isEmptyOrWhitespace;
				if (previousLineIsEmpty) {
					const match = line.text.match(sequenceRegex);
					if (match) {
						workspaceEdit.replace(documentUri, line.range, String(offset) + line.text.replace(sequenceRegex, ''));
						++offset;
					}
				}
			}
		}
	}

	await vscode.workspace.applyEdit(workspaceEdit);

	return true;
}

async function reorder() {
	const textEditor = vscode.window.activeTextEditor;

	if (typeof textEditor === 'undefined') {
		return false;
	}

	const workspaceEdit = new vscode.WorkspaceEdit();
	const documentUri = textEditor.document.uri;
	const selections = !textEditor.selection.isEmpty
		? textEditor.selections
		: [new vscode.Selection(textEditor.document.positionAt(0), textEditor.document.lineAt(textEditor.document.lineCount - 1).range.end)];

	for (const selection of selections) {
		const frames: Frame[] = [];
		let frame: Frame | null = null;
		for (let lineIndex = selection.start.line; lineIndex <= selection.end.line; ++lineIndex) {
			const line = textEditor.document.lineAt(lineIndex);
			const previousLineIsEmpty = lineIndex === 0 || textEditor.document.lineAt(lineIndex - 1).isEmptyOrWhitespace;
			if (previousLineIsEmpty && sequenceRegex.test(line.text)) {
				frame = {
					lineIndex,
					sequence: Number.parseInt(line.text, 10),
					lines: [line]
				};
				frames.push(frame);
			} else {
				if (!frame) {
					frame = {
						lineIndex,
						sequence: Number.NEGATIVE_INFINITY,
						lines: []
					};
					frames.push(frame);
				}
				frame.lines.push(line);
			}
		}
		frames.sort((a, b) => a.sequence !== b.sequence ? a.sequence - b.sequence : a.lineIndex - b.lineIndex);
		const lines = frames.reduce((acc, frame) => { acc.push(...frame.lines.map(line => line.text + '\n')); return acc; }, [] as string[]);
		workspaceEdit.replace(documentUri, selection, lines.join('').replace(/\n$/, ''));
	}

	await vscode.workspace.applyEdit(workspaceEdit);

	return true;
}

function findFirstTime(textDocument: vscode.TextDocument, lineNumbers: number[]): Time {
	for (const lineNumber of lineNumbers) {
		const line = textDocument.lineAt(lineNumber);
		const timeLine = TimeLine.parse(line.text);
		if (timeLine) {
			timeLine.startTime.normalize();
			return timeLine.startTime;
		}
	}
	return Time.parse('');
}

async function linearCorrection() {
	const textEditor = vscode.window.activeTextEditor;

	if (typeof textEditor === 'undefined') {
		return false;
	}

	const keys = Array.from(Array(textEditor.document.lineCount).keys());
	const firstTime = findFirstTime(textEditor.document, keys).format();
	const secondTime = findFirstTime(textEditor.document, keys.reverse()).format();

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

	const firstMapping = firstValue.split(' -> ').map(Time.parse);
	const secondMapping = secondValue.split(' -> ').map(Time.parse);
	const originalTimeLine = new TimeLine(firstMapping[0], secondMapping[0]);
	const updatedTimeLine = new TimeLine(firstMapping[1], secondMapping[1]);

	const workspaceEdit = new vscode.WorkspaceEdit();
	const documentUri = textEditor.document.uri;
	const selections = !textEditor.selection.isEmpty
		? textEditor.selections
		: [new vscode.Selection(textEditor.document.positionAt(0), textEditor.document.lineAt(textEditor.document.lineCount - 1).range.end)];

	for (const selection of selections) {
		for (let lineIndex = selection.start.line; lineIndex <= selection.end.line; ++lineIndex) {
			const line = textEditor.document.lineAt(lineIndex);
			const timeLine = TimeLine.parse(line.text);
			if (timeLine) {
				timeLine.applyLinearCorrection(originalTimeLine, updatedTimeLine);
				workspaceEdit.replace(documentUri, line.range, timeLine.format());
			} else if (TIME_TAG_REGEX.test(line.text)) {
				workspaceEdit.replace(documentUri, line.range,
					line.text.replace(TIME_TAG_REGEX, (_match, text) => {
						const time = Time.parse(text);
						time.applyLinearCorrection(originalTimeLine, updatedTimeLine);
						return `<${time.format()}>`;
					}));
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
		const originalLineLength = encodeURIComponent(originalLine).length;
		if (length + originalLineLength + 1 > 8000) {
			const translatedText = await translateText(language, lines.join('\n'));
			Array.prototype.push.apply(result, translatedText.split('\n'));
			lines.length = 0;
			length = 0;
		}
		lines.push(originalLine);
		length += originalLineLength + 1;
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
				// eslint-disable-next-line @typescript-eslint/naming-convention
				'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.110 Safari/537.36'
			}
		};
		https.get(opts, res => {
			if (res.statusCode !== 200) {
				reject(new Error(``));
			}
			let body = '';
			res.setEncoding('utf8');
			res.on('data', d => body += d);
			res.on('end', () => resolve(body));
		});
	});
}

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.commands.registerCommand('subtitles.shift', shift));
	context.subscriptions.push(vscode.commands.registerCommand('subtitles.renumber', renumber));
	context.subscriptions.push(vscode.commands.registerCommand('subtitles.reorder', reorder));
	context.subscriptions.push(vscode.commands.registerCommand('subtitles.linearCorrection', linearCorrection));
	context.subscriptions.push(vscode.commands.registerCommand('subtitles.translate', translate));
}

export function deactivate() {
}
