/**
 * Studio Tool Launchers
 *
 * Handles launching external applications and URLs for studio tools.
 * Uses Electron's shell module for secure external launching.
 */

const { shell } = require('electron');
const path = require('path');
const os = require('os');

// Tool configuration with URLs and local paths
const studioTools = {
  video: {
    type: 'app',
    // On macOS, attempt to open iMovie or default video editor
    macApp: '/Applications/iMovie.app',
    fallbackUrl: null // No web fallback for video editing
  },
  website: {
    type: 'url',
    url: 'https://webflow.com' // Popular website builder
  },
  replicate: {
    type: 'url',
    url: 'https://replicate.com'
  },
  suno: {
    type: 'url',
    url: 'https://suno.ai'
  },
  dalle: {
    type: 'url',
    url: 'https://labs.openai.com'
  },
  ideogram: {
    type: 'url',
    url: 'https://ideogram.ai'
  },
  myaudio: {
    type: 'path',
    // Opens the user's Music folder
    getPath: () => path.join(os.homedir(), 'Music')
  },
  briizclerk: {
    type: 'placeholder',
    message: 'Briiz-Clerk workflow coming soon'
  }
};

/**
 * Launch a studio tool by its ID
 * @param {string} toolId - The tool identifier (e.g., 'video', 'suno')
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function launchTool(toolId, customUrl = '') {
  const tool = studioTools[toolId];

  if (!tool) {
    return {
      success: false,
      message: `Unknown tool: ${toolId}`
    };
  }

  try {
    if (customUrl) {
      await shell.openExternal(customUrl);
      return { success: true, message: `Opened ${customUrl}` };
    }
    switch (tool.type) {
      case 'url':
        // Open URL in default browser
        await shell.openExternal(tool.url);
        return {
          success: true,
          message: `Opened ${tool.url}`
        };

      case 'path':
        // Open a local folder/file
        const localPath = tool.getPath();
        const result = await shell.openPath(localPath);
        if (result) {
          // openPath returns empty string on success, error message on failure
          return {
            success: false,
            message: `Failed to open path: ${result}`
          };
        }
        return {
          success: true,
          message: `Opened ${localPath}`
        };

      case 'app':
        // Try to open a local application
        if (process.platform === 'darwin' && tool.macApp) {
          const appResult = await shell.openPath(tool.macApp);
          if (appResult) {
            // App not found, try fallback URL if available
            if (tool.fallbackUrl) {
              await shell.openExternal(tool.fallbackUrl);
              return {
                success: true,
                message: `App not found, opened ${tool.fallbackUrl}`
              };
            }
            return {
              success: false,
              message: `Application not found: ${tool.macApp}`
            };
          }
          return {
            success: true,
            message: `Opened ${tool.macApp}`
          };
        }
        // For non-Mac or no macApp defined
        if (tool.fallbackUrl) {
          await shell.openExternal(tool.fallbackUrl);
          return {
            success: true,
            message: `Opened ${tool.fallbackUrl}`
          };
        }
        return {
          success: false,
          message: 'No application configured for this platform'
        };

      case 'placeholder':
        return {
          success: false,
          message: tool.message
        };

      default:
        return {
          success: false,
          message: `Unknown tool type: ${tool.type}`
        };
    }
  } catch (error) {
    return {
      success: false,
      message: `Error launching tool: ${error.message}`
    };
  }
}

/**
 * Get information about all available studio tools
 * @returns {Object} Tool configurations (without functions)
 */
function getToolsInfo() {
  const info = {};
  for (const [id, tool] of Object.entries(studioTools)) {
    info[id] = {
      type: tool.type,
      url: tool.url || null,
      message: tool.message || null
    };
  }
  return info;
}

module.exports = {
  launchTool,
  getToolsInfo
};
