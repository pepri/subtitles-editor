import * as vscode from 'vscode';

export interface Frame {
	lineIndex: number;
	sequence: number;
	lines: vscode.TextLine[];
}
