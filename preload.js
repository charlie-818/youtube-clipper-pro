// preload.js
const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload script executing...');

// First, check if contextBridge is available
if (contextBridge) {
  console.log('contextBridge is available, exposing API...');
  
  // Expose protected methods that allow the renderer process to use
  // the ipcRenderer without exposing the entire object
  contextBridge.exposeInMainWorld(
    'api', {
      // Test function to verify the API is working
      test: () => 'API is working correctly!',
      
      // General app methods
      getPreferences: () => {
        console.log('Calling getPreferences from preload');
        return ipcRenderer.invoke('get-preferences');
      },
      
      // Basic methods only for testing
      ping: () => 'pong',
      
      // Echo function to test IPC
      echo: (msg) => {
        console.log('Echo called with:', msg);
        return ipcRenderer.invoke('echo', msg);
      },
      
      // Project management
      getProjects: () => ipcRenderer.invoke('get-projects'),
      saveProject: (project) => ipcRenderer.invoke('save-project', project),
      deleteProject: (projectId) => ipcRenderer.invoke('delete-project', projectId),
      addVideoToProject: (projectId, videoData) => ipcRenderer.invoke('add-video-to-project', projectId, videoData),
      
      // YouTube operations
      extractYouTubeVideo: (url, options) => ipcRenderer.invoke('extract-youtube-video', url, options),
      
      // Video processing
      processVideo: (inputPath, operations, outputPath) => 
        ipcRenderer.invoke('process-video', inputPath, operations, outputPath),
      
      // Convert video to vertical format
      processVideoVertical: (videoPath) => {
        console.log('Calling processVideoVertical from preload with path:', videoPath);
        return ipcRenderer.invoke('process-video-vertical', videoPath);
      },
      
      // Audio processing
      extractAudio: (videoPath, outputPath) => ipcRenderer.invoke('extract-audio', videoPath, outputPath),
      mixAudio: (audioPaths, outputPath, volumes) => ipcRenderer.invoke('mix-audio', audioPaths, outputPath, volumes),
      
      // Subtitle operations
      generateSubtitles: (inputPath, options) => ipcRenderer.invoke('generate-subtitles', inputPath, options),
      
      // AI Voice Generation
      generateVoice: (text, options) => ipcRenderer.invoke('generate-voice', text, options),
      
      // Video export
      exportVideo: (project, options) => ipcRenderer.invoke('export-video', project, options),
      
      // File dialogs
      showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
      showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
      
      // Event listeners
      on: (channel, callback) => {
        // Whitelist channels
        const validChannels = [
          'download-progress',
          'export-progress',
          'processing-progress'
        ];
        if (validChannels.includes(channel)) {
          ipcRenderer.on(channel, (event, ...args) => callback(...args));
        }
      },
      off: (channel, callback) => {
        const validChannels = [
          'download-progress',
          'export-progress',
          'processing-progress'
        ];
        if (validChannels.includes(channel)) {
          ipcRenderer.removeListener(channel, callback);
        }
      },
      
      // File operations
      readTextFile: (filePath) => ipcRenderer.invoke('read-text-file', filePath),
      fileExists: (filePath) => ipcRenderer.invoke('file-exists', filePath),
      
      // New downloadVideoWithSubtitles method
      downloadVideoWithSubtitles: (videoPath, subtitlesPath, outputPath, style) => {
        console.log('Calling downloadVideoWithSubtitles from preload:', videoPath, subtitlesPath, style);
        return ipcRenderer.invoke('download-video-with-subtitles', videoPath, subtitlesPath, outputPath, style);
      }
    }
  );
  console.log('API exposed successfully');
} else {
  console.error('contextBridge not available!');
} 