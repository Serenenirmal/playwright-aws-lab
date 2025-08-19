// Simplified Lambda - just triggers GitHub Actions
const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

exports.handler = async (event, context) => {
  console.log('Triggering GitHub Actions workflow...');
  
  try {
    // Trigger GitHub Actions workflow
    const response = await octokit.rest.actions.createWorkflowDispatch({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      workflow_id: 'test-only.yml', // New workflow just for testing
      ref: 'main',
      inputs: {
        trigger_source: 'lambda_schedule'
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'GitHub Actions workflow triggered',
        workflowUrl: `https://github.com/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/actions`
      })
    };
  } catch (error) {
    console.error('Failed to trigger workflow:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};
