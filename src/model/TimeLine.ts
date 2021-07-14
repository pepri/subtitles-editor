import { Time } from "./Time";

const TIME_LINE_REGEX = /^\s*(?<startSign>[+\-]?)(?:(?<startHours>\d+):)?(?<startMinutes>\d+):(?<startSeconds>\d{2})(?:(?<startSeparator>[,.])(?<startMillis>\d+))?\s*(?<separator>-->|,)\s*(?<endSign>[+\-]?)(?:(?<endHours>\d+):)?(?<endMinutes>\d+):(?<endSeconds>\d{2})(?:(?<endSeparator>[,.])(?<endMillis>\d+))?\s*(?<extraData>.*?)\s*$/;

export class TimeLine {
	constructor(
		public startTime: Time,
		public endTime: Time,
		private separator: string = '-->',
		private extraData: string = '',
	) {
	}

	static parse(line: string): TimeLine | null {
		const groups = line?.match(TIME_LINE_REGEX)?.groups;
		if (!groups) {
			return null;
		}
		const startValue = Time.value(groups.startSign, groups.startHours, groups.startMinutes, groups.startSeconds, groups.startMillis);
		const endValue = Time.value(groups.endSign, groups.endHours, groups.endMinutes, groups.endSeconds, groups.endMillis);
		const startTime = new Time(startValue, groups.startSeparator, (groups.startMillis || '').length === 2);
		const endTime = new Time(endValue, groups.endSeparator, (groups.endMillis || '').length === 2);
		const separator = groups.separator === '-->' ? ` ${groups.separator} ` : groups.separator;
		const extraData = groups.extraData ? ' ' + groups.extraData : '';
		return new TimeLine(startTime, endTime, separator, extraData);
	}

	shift(offset: number): void {
		this.startTime.shift(offset);
		this.endTime.shift(offset);
	}

	applyLinearCorrection(original: TimeLine, updated: TimeLine): void {
		this.startTime.applyLinearCorrection(original, updated);
		this.endTime.applyLinearCorrection(original, updated);
	}

	convert(timeSeparator: string, millisSeparator: string, shortMillis: boolean) {
		this.startTime.convert(millisSeparator, shortMillis);
		this.endTime.convert(millisSeparator, shortMillis);
		this.separator = timeSeparator;
	}

	format() {
		return `${this.startTime.format()}${this.separator}${this.endTime.format()}${this.extraData}`;
	}
}
