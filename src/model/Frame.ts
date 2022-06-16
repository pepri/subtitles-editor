import * as vscode from 'vscode';
import { TimeLine } from './TimeLine';

export interface Frame {
	lineIndex: number;
	sequence: number;
	timeLine: TimeLine | null;
	lines: vscode.TextLine[];
}

export namespace Frame {
	export function compareSequence(a: Frame, b: Frame): number {
		return a.sequence !== b.sequence ? a.sequence - b.sequence : a.lineIndex - b.lineIndex;
	}

	export function compareTimestamp(a: Frame, b: Frame): number {
		if (a.timeLine !== null || b.timeLine !== null) {
			if (a.timeLine === null) {
				return -1;
			}
			if (b.timeLine === null) {
				return 1;
			}
			if (a.timeLine.startTime !== b.timeLine.startTime) {
				return a.timeLine.startTime.value - b.timeLine.startTime.value;
			}
			if (a.timeLine.endTime !== b.timeLine.endTime) {
				return a.timeLine.endTime.value - b.timeLine.endTime.value;
			}
		}
		return compareSequence(a, b);
	}
}
