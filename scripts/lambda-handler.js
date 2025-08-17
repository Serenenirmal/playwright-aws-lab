const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const BUCKET_NAME = process.env.S3_BUCKET_NAME;

/**
 * AWS Lambda handler for running Playwright tests
 */
exports.handler = async (event, context) => {
  const testFile = event.testFile || 'tests/amazon/search.spec.ts';
  const maxRetries = 2;
  let attempt = 0;
  
  console.log(`Starting Playwright test execution: ${testFile}`);
  console.log(`Lambda context: ${JSON.stringify(context)}`);
  
  while (attempt <= maxRetries) {
    try {
      attempt++;
      console.log(`Attempt ${attempt}/${maxRetries + 1}`);
      
      // Run Playwright test
      const testResult = await runPlaywrightTest(testFile);
      
      // Upload artifacts to S3
      const s3Uploads = await uploadArtifactsToS3(testResult.timestamp);
      
      const result = {
        success: testResult.success,
        timestamp: testResult.timestamp,
        testFile,
        attempt,
        output: testResult.output,
        artifacts: s3Uploads,
        lambdaRequestId: context.awsRequestId,
        cost: calculateEstimatedCost(testResult.duration)
      };
      
      console.log(`Test execution completed: ${JSON.stringify(result)}`);
      return result;
      
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);
      
      if (attempt > maxRetries) {
        // Final attempt failed, upload error logs to S3
        const errorTimestamp = new Date().toISOString();
        await uploadErrorToS3(error, errorTimestamp);
        
        return {
          success: false,
          error: error.message,
          timestamp: errorTimestamp,
          testFile,
          attempt,
          lambdaRequestId: context.awsRequestId
        };
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};

/**
 * Execute Playwright test and capture results
 */
async function runPlaywrightTest(testFile) {
  const timestamp = new Date().toISOString();
  const startTime = Date.now();
  
  // Ensure required directories exist in /tmp (Lambda's writable directory)
  const tmpDir = '/tmp';
  const dirs = [
    path.join(tmpDir, 'test-results'), 
    path.join(tmpDir, 'playwright-report')
  ];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
  
  // Don't change working directory - stay in LAMBDA_TASK_ROOT
  
  return new Promise((resolve, reject) => {
    // Use directly installed playwright instead of npx
    const playwrightPath = path.join(process.env.LAMBDA_TASK_ROOT, 'node_modules', '.bin', 'playwright');
    
    const testCommand = spawn('node', [playwrightPath, 'test', testFile, '--reporter=json'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.env.LAMBDA_TASK_ROOT, // Run from Lambda task root
      env: {
        ...process.env,
        PLAYWRIGHT_JSON_OUTPUT_NAME: '/tmp/test-results.json',
        HOME: '/tmp',
        // Use browsers installed in build directory
        PLAYWRIGHT_BROWSERS_PATH: path.join(process.env.LAMBDA_TASK_ROOT, 'browsers'),
        // Override default output directories
        PW_TEST_RESULTS_DIR: '/tmp/test-results',
        PW_OUTPUT_DIR: '/tmp/playwright-report'
      }
    });
    
    let stdout = '';
    let stderr = '';
    
    testCommand.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    testCommand.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    testCommand.on('close', (code) => {
      const duration = Date.now() - startTime;
      const success = code === 0;
      
      resolve({
        success,
        timestamp,
        duration,
        output: {
          stdout,
          stderr,
          exitCode: code
        }
      });
    });
    
    testCommand.on('error', (error) => {
      reject(error);
    });
    
    // Timeout after 14 minutes (Lambda max is 15 minutes)
    setTimeout(() => {
      testCommand.kill('SIGTERM');
      reject(new Error('Test execution timeout (14 minutes)'));
    }, 14 * 60 * 1000);
  });
}

/**
 * Upload test artifacts (videos, screenshots, reports) to S3
 */
async function uploadArtifactsToS3(timestamp) {
  if (!BUCKET_NAME) {
    console.log('S3_BUCKET_NAME not set, skipping S3 upload');
    return { uploaded: false, reason: 'No bucket configured' };
  }
  
  const uploads = [];
  const tmpDir = '/tmp';
  const artifactDirs = [
    path.join(tmpDir, 'test-results'), 
    path.join(tmpDir, 'playwright-report')
  ];
  
  try {
    for (const dir of artifactDirs) {
      if (fs.existsSync(dir)) {
        const files = await getAllFiles(dir);
        
        for (const file of files) {
          const key = `test-runs/${timestamp}/${file.replace(dir + '/', '')}`;
          const content = fs.readFileSync(file);
          
          await s3Client.send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: content,
            ContentType: getContentType(file)
          }));
          
          uploads.push({
            file: file,
            s3Key: key,
            url: `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`
          });
        }
      }
    }
    
    console.log(`Uploaded ${uploads.length} artifacts to S3`);
    return { uploaded: true, files: uploads };
    
  } catch (error) {
    console.error('S3 upload failed:', error);
    // Fall back to local storage (ephemeral)
    return { 
      uploaded: false, 
      reason: 'S3 upload failed', 
      error: error.message,
      fallback: 'Artifacts stored locally (ephemeral)'
    };
  }
}

/**
 * Upload error information to S3 for debugging
 */
async function uploadErrorToS3(error, timestamp) {
  if (!BUCKET_NAME) return;
  
  try {
    const errorReport = {
      timestamp,
      error: error.message,
      stack: error.stack,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        memoryUsage: process.memoryUsage()
      }
    };
    
    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: `errors/${timestamp}/error-report.json`,
      Body: JSON.stringify(errorReport, null, 2),
      ContentType: 'application/json'
    }));
    
    console.log('Error report uploaded to S3');
  } catch (uploadError) {
    console.error('Failed to upload error to S3:', uploadError);
  }
}

/**
 * Recursively get all files in a directory
 */
async function getAllFiles(dirPath) {
  const files = [];
  
  function scanDir(currentPath) {
    const items = fs.readdirSync(currentPath);
    
    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDir(fullPath);
      } else {
        files.push(fullPath);
      }
    }
  }
  
  if (fs.existsSync(dirPath)) {
    scanDir(dirPath);
  }
  
  return files;
}

/**
 * Get appropriate content type for file upload
 */
function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentTypes = {
    '.json': 'application/json',
    '.html': 'text/html',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.txt': 'text/plain',
    '.log': 'text/plain'
  };
  
  return contentTypes[ext] || 'application/octet-stream';
}

/**
 * Calculate estimated cost for the test run
 */
function calculateEstimatedCost(duration) {
  // AWS Lambda pricing (us-east-1): $0.0000166667 per GB-second
  // Memory: 2048MB = 2GB
  const gbSeconds = (2 * duration) / 1000;
  const lambdaCost = gbSeconds * 0.0000166667;
  
  // Add estimated S3 costs (minimal for small artifacts)
  const s3Cost = 0.0001;
  
  const totalCostUSD = lambdaCost + s3Cost;
  const totalCostINR = totalCostUSD * 83; // Approximate USD to INR conversion
  
  return {
    duration: `${duration}ms`,
    lambdaCostUSD: `$${lambdaCost.toFixed(6)}`,
    s3CostUSD: `$${s3Cost.toFixed(6)}`,
    totalCostUSD: `$${totalCostUSD.toFixed(6)}`,
    totalCostINR: `₹${totalCostINR.toFixed(4)}`
  };
}
