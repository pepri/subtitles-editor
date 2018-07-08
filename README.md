# Subtitles Editor

This editor allows you to make edits to SubRip Text (SRT) files with subtitles - shift the timestamps or do a linear correction.

## Features

- Colorizer for SubRip Text (SRT) files.
- Shift all timestamps by a specific time value.
- Linear correction by mapping two existing time stamps to new values.
- Only subtitles in selection are affected. If there is no selection, all subtitles are affected.

## Usage

Use command **Subtitles: Shift** and enter offset time to shift subtitles. The format is "HH:mm:ss,zzz". You can use negative time if subtitles are too late.

The command **Subtitles: Linear Correction** prompts you for two timestamp mappings. The input is in form "original timestamp -> new timestamp". Pick one point from the beginning of the movie and second one from the end of the movie to get the best approximation.


## Release Notes

### 0.0.1

Initial release of Subtitle Editor.
