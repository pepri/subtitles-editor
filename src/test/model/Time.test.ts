import * as assert from 'assert';
import { Time } from '../../model/Time';
import { TimeLine } from '../../model/TimeLine';

function format(time: string): string {
	return Time.parse(time).format();
}

function shift(time: string, offset: string): string {
	const value = Time.parse(time);
	value.shift(Time.parse(offset).value);
	return value.format();
}

function applyLinearCorrection(time: string, originalTimeLine: string, updatedTimeLine: string): string {
	const value = Time.parse(time);
	const originalValue = TimeLine.parse(originalTimeLine);
	const updatedValue = TimeLine.parse(updatedTimeLine);
	if (originalValue && updatedValue) {
		value.applyLinearCorrection(originalValue, updatedValue);
	}
	return value.format();
}

suite('Time Tests', function() {
	test('format', function() {
		assert.strictEqual(format('12:34:56,7891'), '12:34:56,789');
		assert.strictEqual(format('12:34:56.7891'), '12:34:56.789');
		assert.strictEqual(format('12:34:56,789'), '12:34:56,789');
		assert.strictEqual(format('12:34:56.789'), '12:34:56.789');
		assert.strictEqual(format('12:34:56,78'), '12:34:56,78');
		assert.strictEqual(format('12:34:56.78'), '12:34:56.78');
		assert.strictEqual(format('12:34:56,7'), '12:34:56,700');
		assert.strictEqual(format('12:34:56.7'), '12:34:56.700');
		assert.strictEqual(format('34:56,789'), '00:34:56,789');
		assert.strictEqual(format('34:56.789'), '00:34:56.789');
		assert.strictEqual(format('34:56,78'), '00:34:56,78');
		assert.strictEqual(format('34:56.78'), '00:34:56.78');
		assert.strictEqual(format('-12:34:56,7891'), '-12:34:56,789');
		assert.strictEqual(format('-12:34:56.7891'), '-12:34:56.789');
		assert.strictEqual(format('-12:34:56,789'), '-12:34:56,789');
		assert.strictEqual(format('-12:34:56.789'), '-12:34:56.789');
		assert.strictEqual(format('-12:34:56,78'), '-12:34:56,78');
		assert.strictEqual(format('-12:34:56.78'), '-12:34:56.78');
		assert.strictEqual(format('-12:34:56,7'), '-12:34:56,700');
		assert.strictEqual(format('-12:34:56.7'), '-12:34:56.700');
		assert.strictEqual(format('-34:56,789'), '-00:34:56,789');
		assert.strictEqual(format('-34:56.789'), '-00:34:56.789');
		assert.strictEqual(format('-34:56,78'), '-00:34:56,78');
		assert.strictEqual(format('-34:56.78'), '-00:34:56.78');
		assert.strictEqual(format('+12:34:56,7891'), '12:34:56,789');
		assert.strictEqual(format('+12:34:56.7891'), '12:34:56.789');
		assert.strictEqual(format('+12:34:56,789'), '12:34:56,789');
		assert.strictEqual(format('+12:34:56.789'), '12:34:56.789');
		assert.strictEqual(format('+12:34:56,78'), '12:34:56,78');
		assert.strictEqual(format('+12:34:56.78'), '12:34:56.78');
		assert.strictEqual(format('+12:34:56,7'), '12:34:56,700');
		assert.strictEqual(format('+12:34:56.7'), '12:34:56.700');
		assert.strictEqual(format('+34:56,789'), '00:34:56,789');
		assert.strictEqual(format('+34:56.789'), '00:34:56.789');
		assert.strictEqual(format('+34:56,78'), '00:34:56,78');
		assert.strictEqual(format('+34:56.78'), '00:34:56.78');
	});

	test('shift', function() {
		assert.strictEqual(shift('65:43:21,123', '11:11:11,111'), '76:54:32,234');
		assert.strictEqual(shift('01:00:00,000', '-02:00:00,000'), '-01:00:00,000');
	});

	test('linear correction', function() {
		assert.strictEqual(applyLinearCorrection('01:00:00,000', '00:00:00,000-->02:00:00,000', '01:00:00,000-->05:00:00,000'), '03:00:00,000');
	});
});
