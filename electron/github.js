/**
 * GitHub Integration Module for briizOS
 * Uses GitHub REST API with personal access token authentication
 * Enables browsing repos and files without cloning
 */

const https = require('https');

// GitHub API base URL
const GITHUB_API_BASE = 'api.github.com';

// Cached token (set from renderer via IPC)
let cachedToken = null;

/**
 * Make an authenticated request to GitHub API
 * @param {string} endpoint - API endpoint (e.g., '/user/repos')
 * @param {string} token - GitHub personal access token
 * @param {string} method - HTTP method (default: GET)
 * @returns {Promise<Object>} - Parsed JSON response
 */
function makeGitHubRequest(endpoint, token, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: GITHUB_API_BASE,
      path: endpoint,
      method: method,
      headers: {
        'User-Agent': 'briizOS-App',
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `Bearer ${token}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);

          if (res.statusCode >= 400) {
            reject(new Error(parsed.message || `GitHub API error: ${res.statusCode}`));
          } else {
            resolve(parsed);
          }
        } catch (e) {
          reject(new Error('Failed to parse GitHub response'));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`GitHub request failed: ${error.message}`));
    });

    req.end();
  });
}

/**
 * Validate GitHub token by fetching user info
 * @returns {Promise<Object>} - User info or error
 */
async function validateToken(token) {
  if (!token || token.trim() === '') {
    return { valid: false, error: 'No token provided' };
  }

  try {
    const user = await makeGitHubRequest('/user', token);
    return {
      valid: true,
      user: {
        login: user.login,
        name: user.name,
        avatar_url: user.avatar_url
      }
    };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Set the GitHub token (called from renderer via IPC)
 * @param {string} token - GitHub personal access token
 */
function setToken(token) {
  cachedToken = token || null;
}

/**
 * Get configured GitHub token
 * @returns {string|null}
 */
function getToken() {
  return cachedToken || process.env.GITHUB_TOKEN || null;
}

/**
 * Check if GitHub is configured with a valid token
 * @returns {Promise<Object>}
 */
async function isConfigured() {
  const token = getToken();
  if (!token) {
    return { configured: false, error: 'No GitHub token configured' };
  }

  const validation = await validateToken(token);
  return {
    configured: validation.valid,
    user: validation.user,
    error: validation.error
  };
}

/**
 * List user's repositories
 * @param {Object} options - Query options
 * @param {string} options.sort - Sort field: created, updated, pushed, full_name
 * @param {string} options.type - Repo type: all, owner, public, private, member
 * @param {number} options.per_page - Results per page (max 100)
 * @param {number} options.page - Page number
 * @returns {Promise<Array>}
 */
async function listRepositories(options = {}) {
  const token = getToken();
  if (!token) {
    return { error: 'GitHub not configured. Add token in Settings.' };
  }

  const { sort = 'updated', type = 'owner', per_page = 30, page = 1 } = options;
  const endpoint = `/user/repos?sort=${sort}&type=${type}&per_page=${per_page}&page=${page}`;

  try {
    const repos = await makeGitHubRequest(endpoint, token);

    // Transform to simpler format
    return repos.map(repo => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      private: repo.private,
      language: repo.language,
      default_branch: repo.default_branch,
      updated_at: repo.updated_at,
      html_url: repo.html_url,
      clone_url: repo.clone_url
    }));
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Get repository contents (files and directories)
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} path - Path within repository (empty for root)
 * @param {string} ref - Branch/commit ref (default: main branch)
 * @returns {Promise<Array>}
 */
async function getRepoContents(owner, repo, path = '', ref = '') {
  const token = getToken();
  if (!token) {
    return { error: 'GitHub not configured. Add token in Settings.' };
  }

  let endpoint = `/repos/${owner}/${repo}/contents/${path}`;
  if (ref) {
    endpoint += `?ref=${ref}`;
  }

  try {
    const contents = await makeGitHubRequest(endpoint, token);

    // API returns array for directories, object for files
    if (!Array.isArray(contents)) {
      // Single file - return as array with one item
      return [{
        name: contents.name,
        path: contents.path,
        type: contents.type,
        size: contents.size,
        sha: contents.sha,
        download_url: contents.download_url,
        html_url: contents.html_url,
        isDirectory: contents.type === 'dir',
        isFile: contents.type === 'file'
      }];
    }

    // Sort: directories first, then files, alphabetically
    const sorted = contents.sort((a, b) => {
      if (a.type === 'dir' && b.type !== 'dir') return -1;
      if (a.type !== 'dir' && b.type === 'dir') return 1;
      return a.name.localeCompare(b.name);
    });

    return sorted.map(item => ({
      name: item.name,
      path: item.path,
      type: item.type,
      size: item.size,
      sha: item.sha,
      download_url: item.download_url,
      html_url: item.html_url,
      isDirectory: item.type === 'dir',
      isFile: item.type === 'file'
    }));
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Get file content from repository
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} path - File path
 * @param {number} maxSize - Maximum file size in bytes (default 500KB)
 * @returns {Promise<Object>}
 */
async function getFileContent(owner, repo, path, maxSize = 500 * 1024) {
  const token = getToken();
  if (!token) {
    return { error: 'GitHub not configured. Add token in Settings.' };
  }

  const endpoint = `/repos/${owner}/${repo}/contents/${path}`;

  try {
    const file = await makeGitHubRequest(endpoint, token);

    if (file.type !== 'file') {
      return { error: 'Path is not a file' };
    }

    if (file.size > maxSize) {
      return {
        error: `File too large (${Math.round(file.size / 1024)}KB). Max: ${Math.round(maxSize / 1024)}KB`,
        truncated: true,
        size: file.size
      };
    }

    // Decode base64 content
    const content = Buffer.from(file.content, 'base64').toString('utf8');

    return {
      name: file.name,
      path: file.path,
      size: file.size,
      sha: file.sha,
      content: content,
      encoding: 'utf-8',
      html_url: file.html_url
    };
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Get repository info
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<Object>}
 */
async function getRepository(owner, repo) {
  const token = getToken();
  if (!token) {
    return { error: 'GitHub not configured. Add token in Settings.' };
  }

  const endpoint = `/repos/${owner}/${repo}`;

  try {
    const repository = await makeGitHubRequest(endpoint, token);

    return {
      id: repository.id,
      name: repository.name,
      full_name: repository.full_name,
      description: repository.description,
      private: repository.private,
      language: repository.language,
      default_branch: repository.default_branch,
      size: repository.size,
      stargazers_count: repository.stargazers_count,
      forks_count: repository.forks_count,
      open_issues_count: repository.open_issues_count,
      created_at: repository.created_at,
      updated_at: repository.updated_at,
      pushed_at: repository.pushed_at,
      html_url: repository.html_url,
      clone_url: repository.clone_url
    };
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * List branches for a repository
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<Array>}
 */
async function listBranches(owner, repo) {
  const token = getToken();
  if (!token) {
    return { error: 'GitHub not configured. Add token in Settings.' };
  }

  const endpoint = `/repos/${owner}/${repo}/branches`;

  try {
    const branches = await makeGitHubRequest(endpoint, token);

    return branches.map(branch => ({
      name: branch.name,
      sha: branch.commit.sha,
      protected: branch.protected
    }));
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Search user's repositories
 * @param {string} query - Search query
 * @returns {Promise<Array>}
 */
async function searchRepositories(query) {
  const token = getToken();
  if (!token) {
    return { error: 'GitHub not configured. Add token in Settings.' };
  }

  // Get user info first for constructing the search query
  try {
    const user = await makeGitHubRequest('/user', token);
    const searchQuery = encodeURIComponent(`${query} user:${user.login}`);
    const endpoint = `/search/repositories?q=${searchQuery}&sort=updated&per_page=20`;

    const result = await makeGitHubRequest(endpoint, token);

    return result.items.map(repo => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      private: repo.private,
      language: repo.language,
      default_branch: repo.default_branch,
      updated_at: repo.updated_at,
      html_url: repo.html_url
    }));
  } catch (error) {
    return { error: error.message };
  }
}

module.exports = {
  setToken,
  validateToken,
  isConfigured,
  listRepositories,
  getRepoContents,
  getFileContent,
  getRepository,
  listBranches,
  searchRepositories
};
