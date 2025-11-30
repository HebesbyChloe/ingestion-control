#!/usr/bin/env node

/**
 * Script to set all repositories for a GitHub user/organization to private
 * 
 * Usage:
 *   node set-repos-private.js <username> <github-token>
 * 
 * Example:
 *   node set-repos-private.js huynhnong ghp_xxxxxxxxxxxxx
 * 
 * Requirements:
 *   - GitHub Personal Access Token with 'repo' scope
 *   - Node.js with fetch support (Node 18+) or install node-fetch
 */

const GITHUB_API_BASE = 'https://api.github.com';

async function fetchAllRepos(username, token) {
  const repos = [];
  let page = 1;
  let hasMore = true;

  console.log(`\n📦 Fetching repositories for ${username}...`);

  while (hasMore) {
    try {
      const response = await fetch(
        `${GITHUB_API_BASE}/users/${username}/repos?per_page=100&page=${page}&type=all`,
        {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'GitHub-Repo-Private-Setter'
          }
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`User/Organization '${username}' not found`);
        }
        if (response.status === 401) {
          throw new Error('Invalid or expired GitHub token. Please check your token.');
        }
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.length === 0) {
        hasMore = false;
      } else {
        repos.push(...data);
        console.log(`   Found ${repos.length} repositories so far...`);
        page++;
        
        // Check if there are more pages
        const linkHeader = response.headers.get('link');
        hasMore = linkHeader && linkHeader.includes('rel="next"');
      }
    } catch (error) {
      if (error.message.includes('fetch')) {
        throw new Error('Network error. Please check your internet connection.');
      }
      throw error;
    }
  }

  return repos;
}

async function setRepoToPrivate(repo, token) {
  try {
    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${repo.full_name}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'GitHub-Repo-Private-Setter'
        },
        body: JSON.stringify({
          private: true
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to update ${repo.name}: ${response.status} ${errorData.message || response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('❌ Error: Missing required arguments');
    console.error('\nUsage: node set-repos-private.js <username> <github-token>');
    console.error('\nExample:');
    console.error('  node set-repos-private.js huynhnong ghp_xxxxxxxxxxxxx');
    console.error('\nTo create a GitHub Personal Access Token:');
    console.error('  1. Go to https://github.com/settings/tokens');
    console.error('  2. Click "Generate new token (classic)"');
    console.error('  3. Select the "repo" scope');
    console.error('  4. Copy the token and use it in this script');
    process.exit(1);
  }

  const [username, token] = args;

  if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
    console.warn('⚠️  Warning: Token format looks unusual. Make sure you\'re using a valid GitHub Personal Access Token.');
  }

  try {
    // Fetch all repositories
    const repos = await fetchAllRepos(username, token);
    
    if (repos.length === 0) {
      console.log(`\n✅ No repositories found for ${username}`);
      return;
    }

    console.log(`\n📊 Found ${repos.length} total repositories`);
    
    // Filter out already private repos
    const publicRepos = repos.filter(repo => !repo.private);
    const privateRepos = repos.filter(repo => repo.private);

    console.log(`   - ${privateRepos.length} already private`);
    console.log(`   - ${publicRepos.length} need to be set to private`);

    if (publicRepos.length === 0) {
      console.log(`\n✅ All repositories are already private!`);
      return;
    }

    // Confirm before proceeding
    console.log(`\n⚠️  About to set ${publicRepos.length} repositories to private:`);
    publicRepos.forEach(repo => {
      console.log(`   - ${repo.full_name}`);
    });

    // Set each public repo to private
    console.log(`\n🔄 Setting repositories to private...\n`);
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const repo of publicRepos) {
      try {
        await setRepoToPrivate(repo, token);
        console.log(`✅ ${repo.full_name} → Private`);
        successCount++;
        
        // Rate limiting: GitHub allows 5000 requests/hour, but be nice
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`❌ ${repo.full_name} → Error: ${error.message}`);
        errorCount++;
        errors.push({ repo: repo.full_name, error: error.message });
      }
    }

    // Summary
    console.log(`\n${'='.repeat(50)}`);
    console.log(`📊 Summary:`);
    console.log(`   ✅ Successfully set to private: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    console.log(`   🔒 Already private: ${privateRepos.length}`);
    console.log(`   📦 Total repositories: ${repos.length}`);

    if (errors.length > 0) {
      console.log(`\n❌ Errors encountered:`);
      errors.forEach(({ repo, error }) => {
        console.log(`   - ${repo}: ${error}`);
      });
    }

    if (successCount > 0) {
      console.log(`\n✅ Successfully set ${successCount} repository/repositories to private!`);
    }

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
main();

