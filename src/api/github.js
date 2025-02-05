// src/api/github.js
export async function fetchLastCommit(repoName) {
    const response = await fetch(`https://api.github.com/repos/${repoName}/commits?per_page=1`);
    if (!response.ok) {
      throw new Error('Network response was not ok.');
    }
    const commits = await response.json();
    return commits.length ? commits[0].sha.substring(0, 7) : 'N/A';
  }
  