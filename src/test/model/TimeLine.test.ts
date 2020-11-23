import * as assert from 'assert';
import { Time } from '../../model/Time';
import { TimeLine } from '../../model/TimeLine';

function format(line: string): string | undefined {
	return TimeLine.parse(line)?.format();
}

function shift(line: string, offset: string): string | undefined {
	const value = TimeLine.parse(line);
	value?.shift(Time.parse(offset).value);
	return value?.format();
}

function applyLinearCorrection(line: string, originalTimeLine: string, updatedTimeLine: string): string | undefined {
	const value = TimeLine.parse(line);
	const originalValue = TimeLine.parse(originalTimeLine);
	const updatedValue = TimeLine.parse(updatedTimeLine);
	if (originalValue && updatedValue) {
		value?.applyLinearCorrection(originalValue, updatedValue);
	}
	return value?.format();
}

suite('TimeLine Tests', function() {
	test('format', function() {
		assert.strictEqual(format('12:34:56,7891 --> 56:43:21,9876'), '12:34:56,789 --> 56:43:21,987');
		assert.strictEqual(format('12:34:56.7891 --> 56:43:21.9876'), '12:34:56.789 --> 56:43:21.987');
		assert.strictEqual(format('12:34:56,789 --> 56:43:21,987'), '12:34:56,789 --> 56:43:21,987');
		assert.strictEqual(format('12:34:56.789 --> 56:43:21.987'), '12:34:56.789 --> 56:43:21.987');
		assert.strictEqual(format('12:34:56,78 --> 56:43:21,98'), '12:34:56,78 --> 56:43:21,98');
		assert.strictEqual(format('12:34:56.78 --> 56:43:21.98'), '12:34:56.78 --> 56:43:21.98');
		assert.strictEqual(format('12:34:56,7 --> 56:43:21,9'), '12:34:56,700 --> 56:43:21,900');
		assert.strictEqual(format('12:34:56.7 --> 56:43:21.9'), '12:34:56.700 --> 56:43:21.900');
		assert.strictEqual(format('34:56,789 --> 43:21,987'), '00:34:56,789 --> 00:43:21,987');
		assert.strictEqual(format('34:56.789 --> 43:21.987'), '00:34:56.789 --> 00:43:21.987');
		assert.strictEqual(format('34:56,78 --> 43:21,98'), '00:34:56,78 --> 00:43:21,98');
		assert.strictEqual(format('34:56.78 --> 43:21.98'), '00:34:56.78 --> 00:43:21.98');
		assert.strictEqual(format('-12:34:56,7891 --> -56:43:21,9876'), '-12:34:56,789 --> -56:43:21,987');
		assert.strictEqual(format('-12:34:56.7891 --> -56:43:21.9876'), '-12:34:56.789 --> -56:43:21.987');
		assert.strictEqual(format('-12:34:56,789 --> -56:43:21,987'), '-12:34:56,789 --> -56:43:21,987');
		assert.strictEqual(format('-12:34:56.789 --> -56:43:21.987'), '-12:34:56.789 --> -56:43:21.987');
		assert.strictEqual(format('-12:34:56,78 --> -56:43:21,98'), '-12:34:56,78 --> -56:43:21,98');
		assert.strictEqual(format('-12:34:56.78 --> -56:43:21.98'), '-12:34:56.78 --> -56:43:21.98');
		assert.strictEqual(format('-12:34:56,7 --> -56:43:21,9'), '-12:34:56,700 --> -56:43:21,900');
		assert.strictEqual(format('-12:34:56.7 --> -56:43:21.9'), '-12:34:56.700 --> -56:43:21.900');
		assert.strictEqual(format('-34:56,789 --> -56:43:21,987'), '-00:34:56,789 --> -56:43:21,987');
		assert.strictEqual(format('-34:56.789 --> -56:43:21.987'), '-00:34:56.789 --> -56:43:21.987');
		assert.strictEqual(format('-34:56,78 --> -56:43:21,98'), '-00:34:56,78 --> -56:43:21,98');
		assert.strictEqual(format('-34:56.78 --> -56:43:21.98'), '-00:34:56.78 --> -56:43:21.98');
		assert.strictEqual(format('+12:34:56,7891 --> +56:43:21,9876'), '12:34:56,789 --> 56:43:21,987');
		assert.strictEqual(format('+12:34:56.7891 --> +56:43:21.9876'), '12:34:56.789 --> 56:43:21.987');
		assert.strictEqual(format('+12:34:56,789 --> +56:43:21,9876'), '12:34:56,789 --> 56:43:21,987');
		assert.strictEqual(format('+12:34:56.789 --> +56:43:21.9876'), '12:34:56.789 --> 56:43:21.987');
		assert.strictEqual(format('+12:34:56,78 --> +56:43:21,98'), '12:34:56,78 --> 56:43:21,98');
		assert.strictEqual(format('+12:34:56.78 --> +56:43:21.98'), '12:34:56.78 --> 56:43:21.98');
		assert.strictEqual(format('+12:34:56,7 --> +56:43:21,9'), '12:34:56,700 --> 56:43:21,900');
		assert.strictEqual(format('+12:34:56.7 --> +56:43:21.9'), '12:34:56.700 --> 56:43:21.900');
		assert.strictEqual(format('+34:56,789 --> +56:43:21,987'), '00:34:56,789 --> 56:43:21,987');
		assert.strictEqual(format('+34:56.789 --> +56:43:21.987'), '00:34:56.789 --> 56:43:21.987');
		assert.strictEqual(format('+34:56,78 --> +56:43:21,98'), '00:34:56,78 --> 56:43:21,98');
		assert.strictEqual(format('+34:56.78 --> +56:43:21.98'), '00:34:56.78 --> 56:43:21.98');
	});

	test('format separator for SRT and VTT', function() {
		assert.strictEqual(format('12:34:56,789-->65:43:21,987'), '12:34:56,789 --> 65:43:21,987');
		assert.strictEqual(format('12:34:56,789 --> 65:43:21,987'), '12:34:56,789 --> 65:43:21,987');
		assert.strictEqual(format('12:34:56,789  -->  65:43:21,987'), '12:34:56,789 --> 65:43:21,987');
	});

	test('format separator for SBV', function() {
		assert.strictEqual(format('12:34:56.78,65:43:21.98'), '12:34:56.78,65:43:21.98');
		assert.strictEqual(format('12:34:56.78 , 65:43:21.98'), '12:34:56.78,65:43:21.98');
	});

	test('format extra data', function() {
		assert.strictEqual(format('12:34:56,789 --> 65:43:21,987 X1:100 X2:100 Y1:100 Y2:100'), '12:34:56,789 --> 65:43:21,987 X1:100 X2:100 Y1:100 Y2:100');
		assert.strictEqual(format('12:34:56,789 --> 65:43:21,987  X1:100 X2:100 Y1:100 Y2:100 '), '12:34:56,789 --> 65:43:21,987 X1:100 X2:100 Y1:100 Y2:100');
	});

	test('shift', function() {
		assert.strictEqual(shift('65:43:21,123 --> 01:23:45,678', '11:11:11,111'), '76:54:32,234 --> 12:34:56,789');
		assert.strictEqual(shift('01:00:00,000 --> 02:00:00,000', '-02:00:00,000'), '-01:00:00,000 --> 00:00:00,000');
	});

	test('linear correction', function() {
		assert.strictEqual(applyLinearCorrection('01:00:00,000 --> 03:00:00,000', '00:00:00,000-->02:00:00,000', '01:00:00,000-->05:00:00,000'), '03:00:00,000 --> 07:00:00,000');
	});
});
