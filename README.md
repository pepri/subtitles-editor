# Subtitles Editor

This editor allows you to make edits to files with subtitles - shift the timestamps, do a linear correction, or translate them to another language.

## Supported File Formats

- SubRip Text (`.srt`)
- WebVTT (`.vtt`)
- SubViewer (`.sbv`, `.sub`)

## Features

- Colorizer for subtitle files.
- Shift all timestamps by a specific time value.
- Renumber frame sequence with specified start index.
- Reorder frames based on their sequence number.
- Linear correction by mapping two existing time stamps to new values.
- Translate subtitles to different languages.
- Only subtitles in selection are affected. If there is no selection, all subtitles are affected.

## Usage

Use command **Subtitles: Shift** and enter offset time to shift subtitles. The format is "HH:mm:ss,zzz". You can use negative time if subtitles are too late.

With **Subtitles: Renumber**, you can renumber the frames using the sequence with specified start index. After selecting this options, enter the start of the sequence (usually `1`) and it will be renumbered accordingly.

The command **Subtitles: Linear Correction** prompts you for two timestamp mappings. The input is in form "original timestamp -> new timestamp". Pick one point from the beginning of the movie and second one from the end of the movie to get the best approximation.

Use command **Subtitles: Translate** to translate subtitles to another language using Google translation service.

With **Subtitles: Reorder**, you can reorder the frames based on their sequence number. This can be useful if you want to work with translated and original subtitles at the same time. You can first translate the subtitles (which will replace the original ones) and append the original subtitles at the end. Then, you can reorder them so you will have translated and original frames near each other.

## For Developers

The goal of this extension is to allow easily modify subtitles files.

Tenet of this software is to do minimal modifications to the file when fulfilling any command, ignoring any errors that might be in the subtitles file. For instance, when asked to renumber frames, it should not modify the time format even if it is invalid. When altering timestamps, keep the time formatting.

All commands are to be applied to selection only. If no selection exists, the whole they should be applied to whole file.

### Existing Subtitle Formats

There is bunch of [existing file formats](https://en.wikipedia.org/wiki/Category:Subtitle_file_formats). This extension currently supports SRT files, but support should be extended to VTT and SVB files.

#### SubRip Text (SRT)

~~~srt
1
00:02:17,440 --> 00:02:20,375
Senator, we're making
our final approach into Coruscant.

2
00:02:20,476 --> 00:02:22,501 X1:100 X2:100 Y1:100 Y2:100
Very good, Lieutenant.
~~~

#### WebVTT (VTT)

~~~vtt
WEBVTT Kind: captions; Language: en

00:09.000 --> 00:11.000
<v Roger Bingham>We are in New York City

00:32.500 --> 00:33.500 align:start size:50%
<v Neil deGrasse Tyson><i>Laughs</i>
~~~

#### SubViewer (SBV, SUB)

~~~sbv
00:01:00.10,00:02:00.20
Oh, no.
The eggs are hatching!
~~~

### Updating Supported Languages

The languages that can be used for translation are published by Google in Google documentation. The extension uses languages defined in `src/languages.json` file.

To convert the published table to JSON:

- copy the table from Google documentation (https://cloud.google.com/translate/docs/languages)
- replace `^(.*?)\t(.*?)(?: \(.+\))?$` with `\t"$2": "$1",`
- remove the last comma
- wrap the result in curly braces
- save it as `src/languages.json`

### Packaging

~~~
npm run package
# verify that packaged .vsix file contains the required files only
npm run publish
~~~
