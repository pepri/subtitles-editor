import { TimeLine } from "./TimeLine";

export const TIME_REGEX = /^\s*(?<sign>[+\-]?)(?:(?<hours>\d+):)?(?<minutes>\d+):(?<seconds>\d{2})(?:(?<separator>[,.])(?<millis>\d+))?\s*$/;
export const TIME_TAG_REGEX = /\<((?<sign>[+\-]?)(?:(?<hours>\d+):)?(?<minutes>\d+):(?<seconds>\d{2})(?:(?<separator>[,.])(?<millis>\d+))?)\>/g;

export class Time {
	constructor(
		public value: number,
		public separator: string,
		public shortMillis: boolean,
	) {
	}

	shift(offset: number): void {
		this.value += offset;
	}

	applyLinearCorrection(original: TimeLine, updated: TimeLine): void {
		const factor = (updated.endTime.value - updated.startTime.value)
			/ (original.endTime.value - original.startTime.value);
		this.value = (this.value - original.startTime.value) * factor + updated.startTime.value;
	}

	normalize(): void {
		this.separator = ',';
		this.shortMillis = false;
	}

	static value(sign: string, hours: string, minutes: string, seconds: string, millis: string): number {
		return (sign === '-' ? -1 : 1) * (Number(hours || 0) * 60 * 60
			+ Number(minutes || 0) * 60
			+ Number(seconds || 0)
			+ Number((millis || '').substr(0, 3)) / Time.pow10(String(millis || '').length));
	}

	static parse(text: string): Time {
		const groups = text?.match(TIME_REGEX)?.groups || {};
		const value = Time.value(groups.sign, groups.hours, groups.minutes, groups.seconds, groups.millis);
		const separator = groups.separator || ',';
		const shortMillis = (groups.millis || '').length === 2;
		return new Time(value, separator, shortMillis);
	}

	format(): string {
		let value = Math.abs(this.value);
		const hours = Math.floor(value / (60 * 60));
		value -= hours * 60 * 60;
		const minutes = Math.floor(value / 60);
		value -= minutes * 60;
		const seconds = Math.floor(value);
		value -= seconds;
		const millis = Math.round(value * (this.shortMillis ? 100 : 1000));
		return (this.value < 0 ? '-' : '')
			+ Time.pad2(hours)
			+ ':'
			+ Time.pad2(minutes)
			+ ':'
			+ Time.pad2(seconds)
			+ this.separator
			+ (this.shortMillis ? Time.pad2(millis) : Time.pad3(millis));
	}

	private static pow10(value: number): number {
		switch (value) {
			case 0: return 1;
			case 1: return 10;
			case 2: return 100;
			default:
			case 3: return 1000;
		}
	}

	private static pad2(value: number): string {
		return value < 10 ? '0' + String(value) : String(value);
	}

	private static pad3(value: number): string {
		if (value < 10) {
			return '00' + String(value);
		} else if (value < 100) {
			return '0' + String(value);
		} else {
			return String(value);
		}
	}
}
