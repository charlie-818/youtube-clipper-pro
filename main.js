// main.js - Electron main process
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const Store = require('electron-store');
const crypto = require('crypto');
const YTDlpWrap = require('yt-dlp-wrap');
const os = require('os');
const fetch = require('node-fetch');
const https = require('https');

// Set up logging
function log(...args) {
  console.log(`[Main Process]`, ...args);
}

log('Starting application...');
log('Process versions:', process.versions);
log('Node version:', process.version);
log('Electron version:', process.versions.electron);
log('Chrome version:', process.versions.chrome);
log('Platform:', process.platform);
log('Architecture:', process.arch);

// Initialize data store
log('Initializing data store...');
const schema = {
  preferences: {
    type: 'object',
    properties: {
      theme: { type: 'string', enum: ['light', 'dark'] },
      autoSave: { type: 'boolean' },
      autoSaveInterval: { type: 'number' },
      defaultExportFormat: { type: 'string' },
      defaultResolution: { type: 'string' },
      hardwareAcceleration: { type: 'boolean' },
      customShortcuts: { type: 'object' }
    }
  },
  projects: {
    type: 'array',
    items: {
      type: 'object'
    }
  }
};

const store = new Store({ schema });

// Keep a global reference of the window object
let mainWindow;
let isDev = process.argv.includes('--dev');

log('Development mode:', isDev ? 'enabled' : 'disabled');

// Create a downloads directory
const downloadsDir = path.join(app.getPath('userData'), 'downloads');
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

function createWindow() {
  log('Creating main window...');
  
  // Verify preload script exists
  const preloadPath = path.join(__dirname, 'preload.js');
  if (!fs.existsSync(preloadPath)) {
    log('ERROR: Preload script not found at:', preloadPath);
  } else {
    log('Preload script found at:', preloadPath);
  }
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath
    }
  });

  // Check for different environment paths
  let htmlPath;
  if (isDev) {
    // In development, load from public directory
    htmlPath = path.join(__dirname, 'public', 'index.html');
    log('Development mode: loading from public directory');
  } else {
    // In production, load from dist directory (webpack output)
    htmlPath = path.join(__dirname, 'dist', 'index.html');
    if (!fs.existsSync(htmlPath)) {
      // Fallback to public directory if dist doesn't exist
      htmlPath = path.join(__dirname, 'public', 'index.html');
      log('Dist directory not found, falling back to public directory');
    } else {
      log('Production mode: loading from dist directory');
    }
  }
  
  if (!fs.existsSync(htmlPath)) {
    log('ERROR: HTML file not found at:', htmlPath);
  } else {
    log('Loading HTML from:', htmlPath);
  }
  
  mainWindow.loadFile(htmlPath);
  
  // ALWAYS open DevTools for debugging
  log('Opening DevTools...');
  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    log('Main window closed');
    mainWindow = null;
  });
  
  // Log when window is ready
  mainWindow.webContents.on('did-finish-load', () => {
    log('Window content loaded successfully');
  });
  
  // Log errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    log('ERROR: Failed to load content:', errorCode, errorDescription);
  });
}

// App lifecycle events
app.on('ready', () => {
  log('App ready event received');
  createWindow();
});

app.on('window-all-closed', () => {
  log('All windows closed');
  if (process.platform !== 'darwin') {
    log('Quitting application');
    app.quit();
  }
});

app.on('activate', () => {
  log('App activated');
  if (mainWindow === null) {
    log('Creating new window on activation');
    createWindow();
  }
});

// IPC Communications
log('Setting up IPC handlers...');

// Get preferences
ipcMain.handle('get-preferences', async () => {
  log('Handling get-preferences request');
  const prefs = store.get('preferences', {
    theme: 'dark',
    autoSave: true,
    autoSaveInterval: 5,
    defaultExportFormat: 'mp4',
    defaultResolution: '1080p',
    hardwareAcceleration: true,
    customShortcuts: {}
  });
  log('Returning preferences:', prefs);
  return prefs;
});

// Save preferences
ipcMain.handle('save-preferences', async (event, preferences) => {
  log('Handling save-preferences request:', preferences);
  store.set('preferences', preferences);
  return true;
});

// Get projects
ipcMain.handle('get-projects', async () => {
  log('Handling get-projects request');
  const projects = store.get('projects', []);
  log(`Found ${projects.length} projects`);
  return projects;
});

// Save project
ipcMain.handle('save-project', async (event, project) => {
  log('Handling save-project request:', project?.id);
  
  try {
    // Ensure the project has a valid ID
    if (!project) {
      throw new Error('No project data provided');
    }
    
    // Generate an ID if none exists
    if (!project.id) {
      project.id = generateUUID();
      log(`Generated new ID for project: ${project.id}`);
    }
    
    const projects = store.get('projects', []);
    
    // Debug current projects
    if (projects.length > 0) {
      log(`Current projects: ${projects.map(p => `${p.name} (${p.id})`).join(', ')}`);
    }
    
    const index = projects.findIndex(p => p.id === project.id);
    
    if (index >= 0) {
      log(`Updating existing project: ${project.name} (${project.id})`);
      projects[index] = project;
    } else {
      log(`Adding new project: ${project.name} (${project.id})`);
      projects.push(project);
    }
    
    store.set('projects', projects);
    
    // Return the project with its definitive ID
    log(`Project saved successfully: ${project.name} (${project.id})`);
    return project;
  } catch (error) {
    log('Error saving project:', error);
    throw error;
  }
});

// Helper function to generate a UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Delete project
ipcMain.handle('delete-project', async (event, projectId) => {
  log('Handling delete-project request:', projectId);
  const projects = store.get('projects', []);
  const filteredProjects = projects.filter(p => p.id !== projectId);
  store.set('projects', filteredProjects);
  return true;
});

// Add echo handler for testing
ipcMain.handle('echo', async (event, message) => {
  log('Handling echo request:', message);
  return `ECHO: ${message}`;
});

// Show file open dialog
ipcMain.handle('show-open-dialog', async (event, options) => {
  log('Handling show-open-dialog request:', options);
  return dialog.showOpenDialog(options);
});

// Show file save dialog
ipcMain.handle('show-save-dialog', async (event, options) => {
  log('Handling show-save-dialog request:', options);
  return dialog.showSaveDialog(options);
});

// YouTube video downloader implementation
ipcMain.handle('extract-youtube-video', async (event, url, options = {}) => {
  log('Handling extract-youtube-video request:', url, options);
  
  if (!url) {
    throw new Error('URL is required');
  }
  
  try {
    // Create project-specific folder with timestamp
    const timestamp = Date.now();
    const projectDir = path.join(downloadsDir, `youtube_${timestamp}`);
    fs.mkdirSync(projectDir, { recursive: true });
    
    log(`Created project directory: ${projectDir}`);
    
    // Check if yt-dlp binary is available
    try {
      // Initialize yt-dlp
      const ytDlp = new YTDlpWrap.default();
      
      // Try to get version to check if yt-dlp is available
      try {
        const version = await ytDlp.getVersion();
        log(`yt-dlp version: ${version}`);
      } catch (error) {
        log('Error getting yt-dlp version:', error);
        log('Attempting to download yt-dlp binary...');
        
        // Try to download yt-dlp binary
        try {
          // Create a specific directory for the binary
          const binaryDir = path.join(app.getPath('userData'), 'bin');
          fs.mkdirSync(binaryDir, { recursive: true });
          
          // Create a specific path for the binary
          const ytdlpBinaryName = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
          const binaryPath = path.join(binaryDir, ytdlpBinaryName);
          
          // Download the binary - the method will place it in a default location
          await YTDlpWrap.default.downloadFromGithub();
          log('yt-dlp binary downloaded successfully');
          
          // Install yt-dlp manually using child_process to execute the command
          const { execSync } = require('child_process');
          try {
            // Use python's pip to install yt-dlp if python is available
            log('Attempting to install yt-dlp using pip...');
            execSync('pip install yt-dlp');
            log('yt-dlp installed successfully via pip');
            
            // Initialize ytDlp without a specific binary path, it will find it on PATH
            ytDlp.setBinaryPath('yt-dlp');
            log('Using yt-dlp from system PATH');
          } catch (pipError) {
            log('Failed to install via pip:', pipError.message);
            
            // Fallback: Create our own executable
            log('Downloading yt-dlp directly to:', binaryPath);
            const file = fs.createWriteStream(binaryPath);
            
            // Direct download from GitHub releases
            const url = process.platform === 'win32' 
              ? 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe'
              : 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';
              
            await new Promise((resolve, reject) => {
              https.get(url, (response) => {
                response.pipe(file);
                file.on('finish', () => {
                  file.close();
                  
                  // Make the file executable on non-Windows platforms
                  if (process.platform !== 'win32') {
                    fs.chmodSync(binaryPath, 0o755);
                  }
                  
                  log('yt-dlp binary downloaded successfully to', binaryPath);
                  resolve();
                });
              }).on('error', (err) => {
                fs.unlinkSync(binaryPath);
                reject(err);
              });
            });
            
            // Now set the binary path to our downloaded file
            ytDlp.setBinaryPath(binaryPath);
            log(`Using downloaded yt-dlp binary at: ${binaryPath}`);
          }
          
          // Verify the binary is working
          const version = await ytDlp.getVersion();
          log(`yt-dlp version: ${version}`);
        } catch (dlError) {
          log('Failed to download yt-dlp binary:', dlError);
          
          // Fallback approach - get minimal metadata 
          log('Using fallback approach to fetch video information');
          
          try {
            // Extract the video ID from the URL
            const videoId = url.includes('youtu.be') 
              ? url.split('/').pop().split('?')[0]
              : url.includes('v=') 
                ? new URL(url).searchParams.get('v')
                : null;
                
            if (!videoId) {
              throw new Error('Could not extract video ID from URL');
            }
            
            log(`Extracted video ID: ${videoId}`);
            
            // Get basic metadata from oEmbed endpoint
            const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
            const oembedResponse = await fetch(oembedUrl);
            const metadata = await oembedResponse.json();
            
            log('Retrieved basic metadata:', metadata);
            
            // Get thumbnail
            const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
            const thumbnailPath = path.join(projectDir, 'thumbnail.jpg');
            
            // Download thumbnail
            const thumbnailResponse = await fetch(thumbnailUrl);
            if (thumbnailResponse.ok) {
              const thumbnailData = await thumbnailResponse.buffer();
              fs.writeFileSync(thumbnailPath, thumbnailData);
              log('Downloaded thumbnail to', thumbnailPath);
            }
            
            // Return minimal metadata
            return {
              error: `yt-dlp not available: ${dlError.message}. Using fallback with limited information.`,
              title: metadata.title || 'Unknown Title',
              channel: metadata.author_name || 'Unknown Channel',
              thumbnailPath: fs.existsSync(thumbnailPath) ? thumbnailPath : null,
              url,
              projectDir,
              videoId
            };
          } catch (fallbackError) {
            log('Fallback approach failed:', fallbackError);
            throw new Error(`Failed to download video: ${dlError.message}. Fallback also failed: ${fallbackError.message}`);
          }
        }
      }
      
      // First, get video information
      log('Getting video information...');
      const videoInfoResult = await ytDlp.getVideoInfo(url);
      log('Video info retrieved successfully');
      
      // Extract needed info
      const videoInfo = videoInfoResult || {};
      const videoId = videoInfo.id || 'unknown';
      const title = videoInfo.title || 'Unknown Title';
      const description = videoInfo.description || '';
      const duration = videoInfo.duration || 0;
      const channel = videoInfo.channel || videoInfo.uploader || 'Unknown';
      const uploadDate = videoInfo.upload_date ?
        `${videoInfo.upload_date.slice(0, 4)}-${videoInfo.upload_date.slice(4, 6)}-${videoInfo.upload_date.slice(6, 8)}` :
        new Date().toISOString().split('T')[0];
      
      // Video file paths
      const sanitizedTitle = title.replace(/[\/\\?%*:|"<>]/g, '_').substring(0, 100);
      const videoFilename = `${sanitizedTitle}.mp4`;
      const audioFilename = `${sanitizedTitle}.mp3`;
      const subtitlesFilename = `${sanitizedTitle}.vtt`;
      const thumbnailFilename = `${sanitizedTitle}.jpg`;
      
      const videoPath = path.join(projectDir, videoFilename);
      const audioPath = path.join(projectDir, audioFilename);
      const subtitlesPath = path.join(projectDir, subtitlesFilename);
      const thumbnailPath = path.join(projectDir, thumbnailFilename);
      
      log('Downloading YouTube content...');
      
      // If we can't download with yt-dlp-wrap, create a simplified result
      if (!options.downloadAudio && !options.downloadVideo && !options.downloadSubtitles) {
        // Return just the metadata if no downloads are requested
        return {
          title,
          channel,
          duration,
          uploadDate,
          description,
          url,
          projectDir
        };
      }
      
      // Download video
      let videoExists = false;
      if (options.downloadVideo !== false) {
        try {
          log(`Downloading video to ${videoPath}...`);
          // Use the template format with full path
          const outputTemplate = path.join(projectDir, '%(title)s.%(ext)s');
          await ytDlp.execPromise([
            url,
            '-o', outputTemplate,
            '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
            '--merge-output-format', 'mp4',
            '--restrict-filenames'
          ]);
          
          // Find the created file
          const files = fs.readdirSync(projectDir);
          const videoFile = files.find(file => file.endsWith('.mp4'));
          if (videoFile) {
            const actualVideoPath = path.join(projectDir, videoFile);
            // Rename to our expected name if needed
            if (actualVideoPath !== videoPath) {
              fs.renameSync(actualVideoPath, videoPath);
            }
            videoExists = true;
            log(`Video downloaded successfully to ${videoPath}`);
          }
        } catch (error) {
          log('Failed to download video:', error.message);
        }
      }
      
      // Extract audio
      let audioExists = false;
      if (options.downloadAudio !== false) {
        try {
          log(`Extracting audio to ${audioPath}...`);
          const outputTemplate = path.join(projectDir, 'audio_%(title)s.%(ext)s');
          await ytDlp.execPromise([
            url,
            '-o', outputTemplate,
            '-x', '--audio-format', 'mp3',
            '--restrict-filenames'
          ]);
          
          // Find the created file
          const files = fs.readdirSync(projectDir);
          const audioFile = files.find(file => file.endsWith('.mp3'));
          if (audioFile) {
            const actualAudioPath = path.join(projectDir, audioFile);
            // Rename to our expected name if needed
            if (actualAudioPath !== audioPath) {
              fs.renameSync(actualAudioPath, audioPath);
            }
            audioExists = true;
            log(`Audio extracted successfully to ${audioPath}`);
          }
        } catch (error) {
          log('Failed to extract audio:', error.message);
        }
      }
      
      // Download subtitle if available and requested
      let subtitlesDownloaded = false;
      if (options.downloadSubtitles !== false) {
        try {
          log(`Downloading subtitles to ${subtitlesPath}...`);
          
          // First try to download manual subtitles
          const manualSubOutputTemplate = path.join(projectDir, 'manual_subs_%(title)s');
          try {
            await ytDlp.execPromise([
              url,
              '--write-sub',
              '--skip-download',
              '--sub-format', 'vtt',
              '--sub-lang', 'en',
              '-o', manualSubOutputTemplate,
              '--restrict-filenames'
            ]);
            log('Successfully requested manual subtitles');
          } catch (manualSubError) {
            log('No manual subtitles found:', manualSubError.message);
          }
          
          // Then try auto-generated subtitles (more likely to be available)
          const autoSubOutputTemplate = path.join(projectDir, 'auto_subs_%(title)s');
          try {
            await ytDlp.execPromise([
              url,
              '--write-auto-sub',
              '--skip-download',
              '--sub-format', 'vtt',
              '--sub-lang', 'en',
              '-o', autoSubOutputTemplate,
              '--restrict-filenames'
            ]);
            log('Successfully requested auto-generated subtitles');
          } catch (autoSubError) {
            log('No auto-generated subtitles found:', autoSubError.message);
          }
          
          // Find all subtitle files that might have been created
          const files = fs.readdirSync(projectDir);
          const subtitleFiles = files.filter(file => 
            file.endsWith('.vtt') || 
            file.endsWith('.en.vtt') || 
            file.includes('subs') && file.endsWith('.vtt')
          );
          
          if (subtitleFiles.length > 0) {
            log(`Found ${subtitleFiles.length} subtitle file(s): ${subtitleFiles.join(', ')}`);
            
            // Choose the best subtitle file (prefer manual over auto-generated)
            let bestSubtitleFile = subtitleFiles[0];
            
            // If we have multiple files, prioritize them
            if (subtitleFiles.length > 1) {
              // Prefer files that don't have "auto" in the name
              const manualSubs = subtitleFiles.filter(f => !f.includes('auto'));
              if (manualSubs.length > 0) {
                bestSubtitleFile = manualSubs[0];
              }
            }
            
            const actualSubtitlePath = path.join(projectDir, bestSubtitleFile);
            
            // Rename to our expected name
            if (actualSubtitlePath !== subtitlesPath) {
              fs.renameSync(actualSubtitlePath, subtitlesPath);
            }
            
            // Clean up any other subtitle files
            subtitleFiles.forEach(file => {
              const filePath = path.join(projectDir, file);
              if (filePath !== subtitlesPath && fs.existsSync(filePath)) {
                try {
                  fs.unlinkSync(filePath);
                } catch (cleanupError) {
                  log(`Failed to clean up subtitle file ${file}:`, cleanupError.message);
                }
              }
            });
            
            subtitlesDownloaded = true;
            log(`Subtitles saved successfully to ${subtitlesPath}`);
          } else {
            log('No subtitle files were found');
            
            // Try a third approach using just the --all-subs parameter
            try {
              const allSubsOutputTemplate = path.join(projectDir, 'all_subs_%(title)s');
              await ytDlp.execPromise([
                url,
                '--all-subs',
                '--skip-download',
                '-o', allSubsOutputTemplate,
                '--restrict-filenames'
              ]);
              
              // Check again for subtitle files
              const filesAfterAllSubs = fs.readdirSync(projectDir);
              const subtitleFilesAfterAllSubs = filesAfterAllSubs.filter(file => 
                file.endsWith('.vtt') || file.endsWith('.en.vtt')
              );
              
              if (subtitleFilesAfterAllSubs.length > 0) {
                log(`Found ${subtitleFilesAfterAllSubs.length} subtitle file(s) after trying --all-subs`);
                const bestSubtitleFile = subtitleFilesAfterAllSubs[0];
                const actualSubtitlePath = path.join(projectDir, bestSubtitleFile);
                
                // Rename to our expected name
                if (actualSubtitlePath !== subtitlesPath) {
                  fs.renameSync(actualSubtitlePath, subtitlesPath);
                }
                
                subtitlesDownloaded = true;
                log(`Subtitles saved successfully to ${subtitlesPath}`);
              }
            } catch (allSubsError) {
              log('Failed to download any subtitles with --all-subs:', allSubsError.message);
            }
          }
        } catch (error) {
          log('Failed to download subtitles:', error.message);
        }
        
        // If we still don't have subtitles, create blank ones with the correct timestamps
        if (!subtitlesDownloaded && (videoExists || audioExists)) {
          try {
            log('Creating placeholder subtitles based on video duration');
            
            // Get video duration directly from the video file
            const mediaDuration = videoExists 
              ? await getVideoDuration(videoPath) 
              : await getVideoDuration(audioPath);
            
            // Create varied placeholder messages
            const placeholderMessages = [
              "Ambient sound",
              "Sound continues",
              "Music playing",
              "Sound effects",
              "Background noise"
            ];
            
            // Generate subtitles at regular intervals
            const subtitles = [];
            const segmentLength = 5; // seconds per subtitle
            
            for (let i = 0; i < mediaDuration; i += segmentLength) {
              // Choose a random placeholder message
              const messageIndex = Math.floor(Math.random() * placeholderMessages.length);
              
              subtitles.push({
                id: i.toString(),
                startTime: i,
                endTime: Math.min(i + segmentLength, mediaDuration),
                text: placeholderMessages[messageIndex]
              });
            }
            
            // Save the subtitles to a VTT file
            const vttContent = generateVTT(subtitles);
            fs.writeFileSync(subtitlesPath, vttContent, 'utf8');
            
            subtitlesDownloaded = true;
            log(`Generated placeholder subtitles to ${subtitlesPath}`);
          } catch (placeholderError) {
            log('Failed to create placeholder subtitles:', placeholderError.message);
          }
        }
      }
      
      // Download thumbnail
      let thumbnailDownloaded = false;
      try {
        log(`Downloading thumbnail to ${thumbnailPath}...`);
        const outputTemplate = path.join(projectDir, 'thumb_%(title)s');
        await ytDlp.execPromise([
          url,
          '--write-thumbnail',
          '--skip-download',
          '--convert-thumbnails', 'jpg',
          '-o', outputTemplate,
          '--restrict-filenames'
        ]);
        
        // Find the created thumbnail file
        const files = fs.readdirSync(projectDir);
        const thumbnailFile = files.find(file => file.endsWith('.jpg'));
        if (thumbnailFile) {
          const actualThumbnailPath = path.join(projectDir, thumbnailFile);
          // Rename to our expected name if needed
          if (actualThumbnailPath !== thumbnailPath) {
            fs.renameSync(actualThumbnailPath, thumbnailPath);
          }
          thumbnailDownloaded = true;
          log(`Thumbnail downloaded successfully to ${thumbnailPath}`);
        }
      } catch (error) {
        log('Failed to download thumbnail:', error.message);
      }
      
      // Check if any file was created
      if (!videoExists && !audioExists && !subtitlesDownloaded) {
        log('Warning: No files were successfully downloaded');
      }
      
      // Return the download information
      return {
        videoPath: videoExists ? videoPath : null,
        audioPath: audioExists ? audioPath : null,
        subtitlesPath: subtitlesDownloaded ? subtitlesPath : null,
        thumbnailPath: thumbnailDownloaded ? thumbnailPath : null,
        title,
        channel,
        duration,
        uploadDate,
        description,
        url,
        projectDir
      };
    } catch (error) {
      log('Error with yt-dlp:', error);
      
      // Return a minimal object with just the project directory if yt-dlp fails
      return {
        error: `Failed to process video: ${error.message}`,
        url,
        projectDir
      };
    }
  } catch (error) {
    log('Error downloading YouTube video:', error);
    throw new Error(`Failed to download video: ${error.message}`);
  }
});

// Add video to project
ipcMain.handle('add-video-to-project', async (event, projectId, videoData) => {
  log('Handling add-video-to-project request:', {
    projectId,
    videoPath: videoData.videoPath
  });
  
  try {
    if (!projectId) {
      throw new Error('Project ID is required');
    }
    
    // Get all projects
    const projects = store.get('projects', []);
    log(`Looking for project with ID "${projectId}" among ${projects.length} projects`);
    
    // Debug available project IDs
    const availableIds = projects.map(p => p.id);
    log(`Available project IDs: ${JSON.stringify(availableIds)}`);
    
    // Find the project
    const projectIndex = projects.findIndex(p => p.id === projectId);
    
    if (projectIndex === -1) {
      throw new Error(`Project with ID ${projectId} not found`);
    }
    
    const project = projects[projectIndex];
    log(`Found project: ${project.name} (${project.id})`);
    
    // Check if videoData contains a path
    if (!videoData || (!videoData.videoPath && !videoData.path)) {
      throw new Error('No video path provided');
    }
    
    // Get the video path from videoData
    const videoPath = videoData.videoPath || videoData.path;
    
    // Check if the videoData has subtitlesPath or try to find related subtitle file
    let subtitlesPath = videoData.subtitlesPath;
    if (!subtitlesPath) {
      // Try to find a related subtitle file with the same base name
      const basePath = videoPath.substring(0, videoPath.lastIndexOf('.'));
      const potentialSubtitlePath = basePath + '.vtt';
      
      if (fs.existsSync(potentialSubtitlePath)) {
        subtitlesPath = potentialSubtitlePath;
        log(`Found associated subtitle file: ${subtitlesPath}`);
      }
    }
    
    // Check if the videoData has verticalPath or try to find related vertical format video
    let verticalPath = videoData.verticalPath;
    if (!verticalPath) {
      // Try to find a related vertical format video
      const basePath = videoPath.substring(0, videoPath.lastIndexOf('.'));
      const potentialVerticalPath = basePath + '_vertical.mp4';
      
      if (fs.existsSync(potentialVerticalPath)) {
        verticalPath = potentialVerticalPath;
        log(`Found associated vertical format video: ${verticalPath}`);
      }
    }
    
    // Update the project
    project.videoSource = {
      path: videoPath,
      type: 'local',
      title: videoData.title || path.basename(videoPath, path.extname(videoPath)),
      duration: videoData.duration,
      verticalPath: verticalPath || null
    };
    
    // Add subtitle information if available
    if (subtitlesPath) {
      project.subtitlesSource = {
        path: subtitlesPath,
        type: 'vtt'
      };
    }
    
    // Add audioPath if it exists in videoData
    if (videoData.audioPath && fs.existsSync(videoData.audioPath)) {
      project.audioSource = {
        path: videoData.audioPath,
        type: 'local'
      };
    }
    
    // Add thumbnailPath if it exists in videoData
    if (videoData.thumbnailPath && fs.existsSync(videoData.thumbnailPath)) {
      project.thumbnailPath = videoData.thumbnailPath;
    }
    
    // Update project in store
    projects[projectIndex] = project;
    store.set('projects', projects);
    
    log('Video added to project successfully');
    return project;
  } catch (error) {
    log('Error adding video to project:', error);
    throw error;
  }
});

// Extract audio from video if not already available
ipcMain.handle('extract-audio', async (event, videoPath, destinationPath = null) => {
  log('Handling extract-audio request:', { videoPath, destinationPath });
  
  try {
    if (!videoPath) {
      throw new Error('Video path is required');
    }
    
    if (!fs.existsSync(videoPath)) {
      throw new Error(`Video file not found at: ${videoPath}`);
    }
    
    // Default output path if not specified
    if (!destinationPath) {
      const videoDir = path.dirname(videoPath);
      const videoName = path.basename(videoPath, path.extname(videoPath));
      destinationPath = path.join(videoDir, `${videoName}.mp3`);
    }
    
    log(`Extracting audio from ${videoPath} to ${destinationPath}...`);
    
    // Check if ffmpeg is available
    const ffmpegAvailable = await checkFFmpegAvailable();
    
    if (!ffmpegAvailable) {
      log('FFmpeg not available, using alternative method');
      throw new Error('FFmpeg not available. Please install FFmpeg to enable audio extraction.');
    }
    
    // Use ffmpeg to extract audio
    const { execFile } = require('child_process');
    await new Promise((resolve, reject) => {
      execFile('ffmpeg', [
        '-i', videoPath,
        '-q:a', '0',
        '-map', 'a',
        '-vn',
        destinationPath
      ], (error) => {
        if (error) {
          log('Error extracting audio with ffmpeg:', error);
          reject(error);
        } else {
          log('Audio extracted successfully');
          resolve();
        }
      });
    });
    
    return {
      success: true,
      audioPath: destinationPath
    };
  } catch (error) {
    log('Error extracting audio:', error);
    return {
      success: false,
      error: error.message,
      audioPath: null
    };
  }
});

// Helper function to check if FFmpeg is available
async function checkFFmpegAvailable() {
  try {
    const { execFile } = require('child_process');
    return new Promise((resolve) => {
      execFile('ffmpeg', ['-version'], (error) => {
        if (error) {
          log('FFmpeg not found:', error.message);
          resolve(false);
        } else {
          log('FFmpeg is available');
          resolve(true);
        }
      });
    });
  } catch (error) {
    log('Error checking FFmpeg:', error);
    return false;
  }
}

// Enhanced subtitle generation
ipcMain.handle('generate-subtitles', async (event, videoPath, options = {}) => {
  log('Handling generate-subtitles request:', videoPath, options);
  
  // If no video path, return placeholder subtitles
  if (!videoPath) {
    log('No video path provided, returning placeholder subtitles');
    return [
      {
        id: "0",
        startTime: 0,
        endTime: 5,
        text: "This is a placeholder subtitle"
      },
      {
        id: "1",
        startTime: 5,
        endTime: 10,
        text: "Generated by YouTube Clipper Pro"
      }
    ];
  }
  
  try {
    // Check if the video file exists
    if (!fs.existsSync(videoPath)) {
      throw new Error(`Video file not found: ${videoPath}`);
    }
    
    // Check if FFmpeg is available
    const ffmpegAvailable = await checkFFmpegAvailable();
    if (!ffmpegAvailable) {
      throw new Error('FFmpeg not available. Please install FFmpeg to generate subtitles.');
    }
    
    // Determine output path for subtitles
    const videoDir = path.dirname(videoPath);
    const videoName = path.basename(videoPath, path.extname(videoPath));
    const outputPath = path.join(videoDir, `${videoName}.vtt`);
    
    log(`Generating subtitles for ${videoPath}...`);
    
    // STEP 1: Check if VTT file already exists from previous YouTube download
    if (fs.existsSync(outputPath)) {
      log(`Subtitle file already exists at ${outputPath}`);
      const subtitleContent = fs.readFileSync(outputPath, 'utf8');
      const parsedSubtitles = parseVTT(subtitleContent);
      return parsedSubtitles;
    }
    
    // STEP 2: Look for subtitle files with same name but different extension
    const potentialSubtitleFiles = [
      path.join(videoDir, `${videoName}.srt`),
      path.join(videoDir, `${videoName}.en.vtt`),
      path.join(videoDir, `${videoName}.en.srt`)
    ];
    
    for (const subtitleFile of potentialSubtitleFiles) {
      if (fs.existsSync(subtitleFile)) {
        log(`Found existing subtitle file: ${subtitleFile}`);
        
        // Convert to VTT if needed
        if (subtitleFile.endsWith('.srt')) {
          log('Converting SRT to VTT format');
          try {
            const { execFile } = require('child_process');
            await new Promise((resolve, reject) => {
              execFile('ffmpeg', [
                '-i', subtitleFile,
                outputPath
              ], (error) => {
                if (error) {
                  log('Failed to convert SRT to VTT:', error.message);
                  reject(error);
                } else {
                  log('Successfully converted SRT to VTT');
                  resolve();
                }
              });
            });
          } catch (error) {
            log('Error converting subtitle format:', error);
            // Continue to next method if conversion fails
            continue;
          }
        } else {
          // Just copy the VTT file
          fs.copyFileSync(subtitleFile, outputPath);
        }
        
        if (fs.existsSync(outputPath)) {
          const subtitleContent = fs.readFileSync(outputPath, 'utf8');
          const parsedSubtitles = parseVTT(subtitleContent);
          return parsedSubtitles;
        }
      }
    }
    
    // STEP 3: Try to extract embedded subtitles from the video
    try {
      log('Checking for embedded subtitles...');
      // First list all available streams to see if subtitles exist
      const { execFile } = require('child_process');
      const streams = await new Promise((resolve, reject) => {
        execFile('ffprobe', [
          '-v', 'error',
          '-show_entries', 'stream=index,codec_type',
          '-of', 'json',
          videoPath
        ], (error, stdout) => {
          if (error) {
            reject(error);
            return;
          }
          try {
            const data = JSON.parse(stdout);
            resolve(data.streams || []);
          } catch (e) {
            reject(e);
          }
        });
      });
      
      // Check if any subtitle streams exist
      const subtitleStreams = streams.filter(stream => stream.codec_type === 'subtitle');
      
      if (subtitleStreams.length > 0) {
        log(`Found ${subtitleStreams.length} subtitle stream(s)`);
        
        // Try to extract the first subtitle stream
        await new Promise((resolve, reject) => {
          execFile('ffmpeg', [
            '-i', videoPath,
            '-map', `0:${subtitleStreams[0].index}`,
            outputPath
          ], (error) => {
            if (error) {
              log('Failed to extract embedded subtitles:', error.message);
              reject(error);
            } else {
              log('Successfully extracted embedded subtitles');
              resolve();
            }
          });
        });
        
        if (fs.existsSync(outputPath)) {
          const subtitleContent = fs.readFileSync(outputPath, 'utf8');
          const parsedSubtitles = parseVTT(subtitleContent);
          return parsedSubtitles;
        }
      } else {
        log('No subtitle streams found in the video');
      }
    } catch (error) {
      log('Error checking for embedded subtitles:', error.message);
      // Continue to next method if extraction fails
    }
    
    // STEP 4: Try to use YouTube's auto-generated subtitles via yt-dlp
    if (options.tryYouTube !== false && videoPath.includes('youtube')) {
      try {
        log('Attempting to download YouTube auto-generated subtitles...');
        
        // Extract video ID from path if it looks like a YouTube download
        const videoFileName = path.basename(videoPath);
        const match = videoFileName.match(/([a-zA-Z0-9_-]{11})/);
        const possibleVideoId = match ? match[1] : null;
        
        if (possibleVideoId) {
          log(`Detected possible YouTube ID: ${possibleVideoId}`);
          
          // Construct YouTube URL
          const youtubeUrl = `https://www.youtube.com/watch?v=${possibleVideoId}`;
          
          await new Promise((resolve, reject) => {
            execFile('yt-dlp', [
              '--write-auto-sub',
              '--skip-download',
              '--sub-lang', 'en',
              '--convert-subs', 'vtt',
              '--output', path.join(videoDir, videoName),
              youtubeUrl
            ], (error) => {
              if (error) {
                log('Failed to download YouTube auto-generated subtitles:', error.message);
                reject(error);
              } else {
                log('Successfully downloaded YouTube auto-generated subtitles');
                resolve();
              }
            });
          });
          
          // Check for the downloaded subtitle file
          const autoSubPath = path.join(videoDir, `${videoName}.en.vtt`);
          if (fs.existsSync(autoSubPath)) {
            // Copy to our standard output location
            fs.copyFileSync(autoSubPath, outputPath);
            
            const subtitleContent = fs.readFileSync(outputPath, 'utf8');
            const parsedSubtitles = parseVTT(subtitleContent);
            return parsedSubtitles;
          }
        }
      } catch (error) {
        log('Error downloading YouTube auto-generated subtitles:', error.message);
        // Continue to next method if download fails
      }
    }
    
    // STEP 5: Use audio transcription as a last resort
    // In a real app, we would integrate with a speech-to-text API like Whisper
    // For now, create reasonable placeholders based on video duration
    log('Generating timestamped placeholder subtitles');
    const videoDuration = await getVideoDuration(videoPath);
    
    // Create varied placeholder messages
    const placeholderMessages = [
      "Ambient sound",
      "Sound continues",
      "Music playing",
      "Sound effects",
      "Background noise"
    ];
    
    // Generate subtitles at regular intervals
    const subtitles = [];
    const segmentLength = 5; // seconds per subtitle
    
    for (let i = 0; i < videoDuration; i += segmentLength) {
      // Choose a random placeholder message
      const messageIndex = Math.floor(Math.random() * placeholderMessages.length);
      
      subtitles.push({
        id: i.toString(),
        startTime: i,
        endTime: Math.min(i + segmentLength, videoDuration),
        text: placeholderMessages[messageIndex]
      });
    }
    
    // Save the subtitles to a VTT file
    const vttContent = generateVTT(subtitles);
    fs.writeFileSync(outputPath, vttContent, 'utf8');
    
    log(`Generated placeholder subtitles to ${outputPath}`);
    return subtitles;
  } catch (error) {
    log('Error generating subtitles:', error);
    return [
      {
        id: "error",
        startTime: 0,
        endTime: 5,
        text: `Error generating subtitles: ${error.message}`
      }
    ];
  }
});

// Helper function to format time as MM:SS
function formatSimpleTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Helper function to get video duration
async function getVideoDuration(videoPath) {
  try {
    const { execFile } = require('child_process');
    return new Promise((resolve, reject) => {
      execFile('ffprobe', [
        '-v', 'error',
        '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1',
        videoPath
      ], (error, stdout) => {
        if (error) {
          log('Error getting video duration:', error);
          // Default to 60 seconds if we can't determine
          resolve(60);
        } else {
          const duration = parseFloat(stdout.trim());
          log(`Video duration: ${duration} seconds`);
          resolve(duration || 60);
        }
      });
    });
  } catch (error) {
    log('Error getting video duration:', error);
    return 60; // Default to 60 seconds
  }
}

// Helper function to format time as HH:MM:SS.mmm
function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

// Helper function to generate VTT content
function generateVTT(subtitles) {
  let vttContent = 'WEBVTT\n\n';
  
  subtitles.forEach(subtitle => {
    vttContent += `${subtitle.id}\n`;
    vttContent += `${formatTime(subtitle.startTime)} --> ${formatTime(subtitle.endTime)}\n`;
    vttContent += `${subtitle.text}\n\n`;
  });
  
  return vttContent;
}

// Helper function to parse VTT content
function parseVTT(vttContent) {
  const lines = vttContent.split('\n');
  const subtitles = [];
  
  let currentSubtitle = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line === 'WEBVTT' || line === '') {
      continue;
    }
    
    // Check if this line is a timestamp line (contains '-->')
    if (line.includes('-->')) {
      const [start, end] = line.split('-->').map(timeStr => {
        // Convert timestamp to seconds
        return timeToSeconds(timeStr.trim());
      });
      
      currentSubtitle = {
        id: subtitles.length.toString(),
        startTime: start,
        endTime: end,
        text: ''
      };
      continue;
    }
    
    // If we have a current subtitle and this line is not a number (cue identifier)
    if (currentSubtitle && isNaN(parseInt(line))) {
      // Add this line to the current subtitle text
      if (currentSubtitle.text) {
        currentSubtitle.text += ' ' + line;
      } else {
        currentSubtitle.text = line;
      }
      
      // Check if next line is empty or we're at the end, meaning end of this subtitle
      if (i === lines.length - 1 || lines[i + 1].trim() === '') {
        subtitles.push(currentSubtitle);
        currentSubtitle = null;
      }
    }
  }
  
  return subtitles;
}

// Simple placeholder for voice generation
ipcMain.handle('generate-voice', async (event, text, options) => {
  log('Handling generate-voice request:', text, options);
  return {
    audioUrl: null,
    duration: 3,
    text,
    options
  };
});

// Helper function to convert time string to seconds
function timeToSeconds(timeString) {
  const parts = timeString.split(':');
  return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
}

// Process video to vertical format
ipcMain.handle('process-video-vertical', async (event, videoPath) => {
  log('Handling process-video-vertical request:', videoPath);
  
  try {
    if (!videoPath) {
      throw new Error('Video path is required');
    }
    
    if (!fs.existsSync(videoPath)) {
      throw new Error(`Video file not found: ${videoPath}`);
    }
    
    // Check if FFmpeg is available
    const ffmpegAvailable = await checkFFmpegAvailable();
    if (!ffmpegAvailable) {
      throw new Error('FFmpeg not available. Please install FFmpeg to process videos.');
    }
    
    // Get video dimensions
    const videoInfo = await getVideoInfo(videoPath);
    log('Video dimensions:', videoInfo.width, 'x', videoInfo.height);
    
    // Calculate crop parameters for vertical format (9:16 aspect ratio)
    const aspectRatio = 9 / 16; // Vertical aspect ratio (width:height)
    let cropWidth, cropHeight, cropX, cropY;
    
    if (videoInfo.width / videoInfo.height > aspectRatio) {
      // Video is wider than 9:16, crop the sides
      cropHeight = videoInfo.height;
      cropWidth = Math.floor(videoInfo.height * aspectRatio);
      cropX = Math.floor((videoInfo.width - cropWidth) / 2);
      cropY = 0;
    } else {
      // Video is taller than 9:16, crop the top and bottom
      cropWidth = videoInfo.width;
      cropHeight = Math.floor(videoInfo.width / aspectRatio);
      cropX = 0;
      cropY = Math.floor((videoInfo.height - cropHeight) / 2);
    }
    
    log('Crop dimensions:', `crop=${cropWidth}:${cropHeight}:${cropX}:${cropY}`);
    
    // Create output path in the same directory with "_vertical" suffix
    const outputDir = path.dirname(videoPath);
    const baseName = path.basename(videoPath, path.extname(videoPath));
    const outputPath = path.join(outputDir, `${baseName}_vertical${path.extname(videoPath)}`);
    
    // Process the video with FFmpeg
    const { execFile } = require('child_process');
    await new Promise((resolve, reject) => {
      execFile('ffmpeg', [
        '-i', videoPath,
        '-vf', `crop=${cropWidth}:${cropHeight}:${cropX}:${cropY}`,
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-c:a', 'copy',
        '-y', // Overwrite output file if it exists
        outputPath
      ], (error, stdout, stderr) => {
        if (error) {
          log('Error processing video with ffmpeg:', error);
          reject(error);
        } else {
          log('Video processed successfully');
          resolve();
        }
      });
    });
    
    return {
      success: true,
      originalPath: videoPath,
      verticalPath: outputPath
    };
  } catch (error) {
    log('Error processing video:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// Download video with subtitles burned in
ipcMain.handle('download-video-with-subtitles', async (event, videoPath, subtitlesPath, outputPath, style = 'default') => {
  log('Handling download-video-with-subtitles request:', videoPath, 'with style:', style);
  
  try {
    if (!videoPath) {
      throw new Error('Video path is required');
    }
    
    if (!subtitlesPath) {
      throw new Error('Subtitles path is required');
    }
    
    if (!fs.existsSync(videoPath)) {
      throw new Error(`Video file not found: ${videoPath}`);
    }
    
    if (!fs.existsSync(subtitlesPath)) {
      throw new Error(`Subtitles file not found: ${subtitlesPath}`);
    }
    
    // Check if FFmpeg is available
    const ffmpegAvailable = await checkFFmpegAvailable();
    if (!ffmpegAvailable) {
      throw new Error('FFmpeg not available. Please install FFmpeg to process videos.');
    }
    
    // Check if the video is vertical by examining the dimensions
    const videoInfo = await getVideoInfo(videoPath);
    const aspectRatio = videoInfo.width / videoInfo.height;
    log(`Video dimensions: ${videoInfo.width}x${videoInfo.height}, aspect ratio: ${aspectRatio.toFixed(2)}`);
    
    // Warn if the aspect ratio doesn't look vertical (aspect ratio > 0.6 suggests it's not vertical)
    if (aspectRatio > 0.6) {
      log('Warning: The video does not appear to be in vertical format. For best results, use the vertical version.');
    } else {
      log('Video appears to be in vertical format, proceeding with subtitle burning.');
    }
    
    // Create ytclips folder on desktop if it doesn't exist
    const homeDir = os.homedir();
    const desktopDir = path.join(homeDir, 'Desktop');
    const ytclipsDir = path.join(desktopDir, 'ytclips');
    
    if (!fs.existsSync(ytclipsDir)) {
      log(`Creating ytclips directory at: ${ytclipsDir}`);
      fs.mkdirSync(ytclipsDir, { recursive: true });
    }
    
    // If no output path specified, create one in the ytclips folder
    if (!outputPath) {
      const baseName = path.basename(videoPath, path.extname(videoPath));
      // Add timestamp to avoid overwriting files
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      outputPath = path.join(ytclipsDir, `${baseName}_${style}_${timestamp}${path.extname(videoPath)}`);
    }
    
    log(`Saving video with subtitles to: ${outputPath}`);
    
    // Define subtitle styles based on the selected style
    let subtitleStyle = '';
    
    switch(style) {
      case 'social':
        // Social media style - colorful, modern, no background
        subtitleStyle = 'FontSize=22,FontName=Arial,PrimaryColour=&H00FFFFFF,OutlineColour=&H003F85FF,BackColour=&H00000000,BorderStyle=1,Outline=2.2,Shadow=0.8,MarginV=30,Bold=1';
        break;
      case 'caption':
        // Caption style - clear text with shadow, no background
        subtitleStyle = 'FontSize=24,FontName=Helvetica,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BackColour=&H00000000,BorderStyle=1,Outline=1.8,Shadow=1.2,MarginV=25,Alignment=2';
        break;
      case 'simple':
        // Simple style - clean minimal text, no background
        subtitleStyle = 'FontSize=20,FontName=Roboto,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BackColour=&H00000000,BorderStyle=1,Outline=1.5,Shadow=0.6,MarginV=20';
        break;
      case 'modern':
        // Modern style - sleek with blue outline, no background
        subtitleStyle = 'FontSize=22,FontName=Montserrat,PrimaryColour=&H00FFFFFF,OutlineColour=&H002C5FFE,BackColour=&H00000000,BorderStyle=1,Outline=1.7,Shadow=0.7,MarginV=22,Alignment=2,Bold=0';
        break;
      case 'elegant':
        // Elegant style - sophisticated with subtle effects, no background
        subtitleStyle = 'FontSize=21,FontName=Georgia,PrimaryColour=&H00FAFAFA,OutlineColour=&H00202020,BackColour=&H00000000,BorderStyle=1,Outline=1.3,Shadow=0.9,MarginV=22,Alignment=2,Italic=1';
        break;
      default:
        // Default style - clean with good readability, no background
        subtitleStyle = 'FontSize=20,FontName=Arial,PrimaryColour=&H00FFFFFF,OutlineColour=&H00303030,BackColour=&H00000000,BorderStyle=1,Outline=1.5,Shadow=0.7,MarginV=20';
    }
    
    // Process the video with FFmpeg to add burned-in subtitles
    const { execFile } = require('child_process');
    await new Promise((resolve, reject) => {
      execFile('ffmpeg', [
        '-i', videoPath,
        '-vf', `subtitles=${subtitlesPath}:force_style='${subtitleStyle}'`,
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-c:a', 'copy',
        '-y', // Overwrite output file if it exists
        outputPath
      ], (error, stdout, stderr) => {
        if (error) {
          log('Error adding subtitles to video with ffmpeg:', error);
          reject(error);
        } else {
          log('Video with subtitles created successfully');
          resolve();
        }
      });
    });
    
    return {
      success: true,
      videoPath: outputPath
    };
  } catch (error) {
    log('Error creating video with subtitles:', error);
    return {
      success: false,
      error: error.message,
      videoPath: null
    };
  }
});

// File operations for subtitles and other text files
ipcMain.handle('read-text-file', async (event, filePath) => {
  log(`Handling read-text-file request for: ${filePath}`);
  
  try {
    if (!filePath) {
      throw new Error('File path is required');
    }
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    return content;
  } catch (error) {
    log('Error reading text file:', error);
    return null;
  }
});

ipcMain.handle('file-exists', async (event, filePath) => {
  log(`Checking if file exists: ${filePath}`);
  
  try {
    if (!filePath) {
      return false;
    }
    
    return fs.existsSync(filePath);
  } catch (error) {
    log('Error checking if file exists:', error);
    return false;
  }
});

// Helper function to get video information using FFmpeg
async function getVideoInfo(videoPath) {
  const { execFile } = require('child_process');
  return new Promise((resolve, reject) => {
    execFile('ffprobe', [
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=width,height,duration',
      '-of', 'json',
      videoPath
    ], (error, stdout, stderr) => {
      if (error) {
        log('Error getting video info:', error);
        reject(error);
        return;
      }
      
      try {
        const info = JSON.parse(stdout);
        const stream = info.streams[0];
        resolve({
          width: parseInt(stream.width),
          height: parseInt(stream.height),
          duration: parseFloat(stream.duration || 0)
        });
      } catch (parseError) {
        log('Error parsing video info:', parseError);
        reject(parseError);
      }
    });
  });
}