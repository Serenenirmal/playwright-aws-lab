// GitHub Actions Trigger Lambda (FREE TIER FRIENDLY)
const https = require('https');

/**
 * Triggers GitHub Actions workflow via REST API
 * This Lambda is tiny, fast, and stays within free tier limits
 */
exports.handler = async (event, context) => {
  console.log('Lambda triggered, dispatching GitHub Actions workflow...');
  
  const { 
    GITHUB_TOKEN, 
    GITHUB_OWNER, 
    GITHUB_REPO,
    S3_BUCKET_NAME 
  } = process.env;
  
  if (!GITHUB_TOKEN || GITHUB_TOKEN === 'dummy-token') {
    return {
      statusCode: 400,
      body: JSON.stringify({
        success: false,
        error: 'GitHub token not configured'
      })
    };
  }

  try {
    // Trigger the test-only workflow
    const workflowDispatch = await triggerGitHubWorkflow({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      token: GITHUB_TOKEN,
      workflowId: 'test-only.yml',
      inputs: {
        trigger_source: 'aws_lambda',
        s3_bucket: S3_BUCKET_NAME,
        timestamp: new Date().toISOString()
      }
    });

    console.log('GitHub Actions workflow triggered successfully');
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Playwright tests triggered via GitHub Actions',
        workflowUrl: `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/actions`,
        lambdaRequestId: context.awsRequestId,
        triggerTime: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Failed to trigger GitHub Actions:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message,
        lambdaRequestId: context.awsRequestId
      })
    };
  }
};

/**
 * Trigger GitHub Actions workflow using native HTTPS
 * No external dependencies = smaller package = free tier friendly
 */
function triggerGitHubWorkflow({ owner, repo, token, workflowId, inputs = {} }) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      ref: 'main',
      inputs
    });

    const options = {
      hostname: 'api.github.com',
      port: 443,
      path: `/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'Playwright-AWS-Lab-Lambda',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 204) {
          resolve({ success: true });
        } else {
          reject(new Error(`GitHub API returned status ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}
