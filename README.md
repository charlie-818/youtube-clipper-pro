# YouTube Clipper Pro

YouTube Clipper Pro is an AI-powered video editing tool designed to help you extract, edit, and enhance video clips from YouTube content with advanced customization features.

![YouTube Clipper Pro](screenshot.png)

## Features

### Video Extraction & Editing
- Extract segments from any YouTube video by specifying start and end timestamps
- Support for various quality settings (360p to 4K) with automatic format detection
- Intuitive timeline editor with frame-by-frame precision
- Ability to trim, cut, and rearrange multiple segments into a single compilation
- Split-screen functionality to display two videos vertically with independent timing controls
- Support for adding transitions between clips (fade, dissolve, wipe, etc.)

### Caption & Subtitle Enhancement
- Automatic extraction of YouTube captions/transcripts
- Convert extracted captions into visually appealing, customizable subtitles
- Style options for subtitles including fonts, colors, effects, and animations
- Caption editing capabilities to correct errors or add custom text

### Audio Enhancement
- Built-in library of royalty-free background music
- Audio mixer to balance original video audio with added music
- Volume normalization and audio enhancement tools
- Audio effects library (echo, reverb, bass boost, etc.)
- AI-powered noise reduction for cleaner audio

### AI Voice Generation
- Text-to-speech functionality using professional voice models
- Multiple voice options covering different genders, accents, and speaking styles
- Emotion and emphasis controls for natural-sounding narration
- Option to replace original audio completely or mix with original
- AI script generation based on video content with editing capabilities

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)
- FFmpeg (v4.3 or higher)
- yt-dlp (latest version recommended)

### Setup

1. Clone the repository:
```
git clone https://github.com/yourusername/youtube-clipper-pro.git
cd youtube-clipper-pro
```

2. Install dependencies:
```
npm install
```

3. Install external dependencies:

#### FFmpeg
- **macOS** (using Homebrew):
  ```
  brew install ffmpeg
  ```
- **Windows** (using Chocolatey):
  ```
  choco install ffmpeg
  ```
- **Linux** (Ubuntu/Debian):
  ```
  sudo apt-get install ffmpeg
  ```

#### yt-dlp
- **macOS** (using Homebrew):
  ```
  brew install yt-dlp
  ```
- **Windows** (using pip):
  ```
  pip install yt-dlp
  ```
- **Linux**:
  ```
  sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
  sudo chmod a+rx /usr/local/bin/yt-dlp
  ```

4. Start the application:
```
npm start
```

## Development

To run the application in development mode:

```
npm run dev
```

This will start the application with hot-reloading enabled.

## Building for Production

To build the application for production:

```
npm run build
```

This will create distributable packages for your operating system in the `dist` directory.

To build for a specific platform:

```
npm run build:mac    # macOS
npm run build:win    # Windows
npm run build:linux  # Linux
```

## Usage Guide

### Downloading YouTube Videos
1. Open the application
2. Click on "Import from YouTube"
3. Paste a YouTube URL and select download options
4. Click "Import Video"

### Editing Video Clips
1. Once a video is imported, use the timeline to select portions of the video
2. Use the trim tool to extract the desired segment
3. Add multiple clips to the timeline by importing more videos or duplicating segments
4. Arrange clips by dragging them on the timeline

### Adding and Editing Subtitles
1. Use the "Subtitles" panel to view and edit extracted captions
2. Click on a subtitle to edit its text, style, and timing
3. Preview subtitle styles in real-time

### Using AI Voice Generation
1. Go to the "Voice" tab
2. Enter text or use the "Suggest" button to generate a script
3. Choose voice, emotion, speed, and pitch settings
4. Click "Generate Voice" to create AI narration
5. Add the generated voice to your timeline

### Exporting Your Project
1. Click the "Export" button
2. Choose your desired format, quality, and other settings
3. Select a destination for the exported file
4. Click "Export" to render your project

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

- [FFmpeg](https://ffmpeg.org/) - for video processing
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) - for YouTube video downloading
- [React](https://reactjs.org/) - for the user interface
- [Electron](https://www.electronjs.org/) - for the desktop application framework 