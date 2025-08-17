#!/usr/bin/env node

/**
 * Local simulation of Lambda handler for testing
 */

const handler = require('./lambda-handler');

// Mock AWS Lambda context
const mockContext = {
  awsRequestId: 'local-test-' + Date.now(),
  functionName: 'playwright-aws-lab-test-runner',
  functionVersion: '$LATEST',
  memoryLimitInMB: '2048',
  remainingTimeInMillis: () => 900000 // 15 minutes
};

// Mock event
const mockEvent = {
  testFile: process.argv[2] || 'tests/amazon/search.spec.ts',
  source: 'local-testing'
};

console.log('🧪 Testing Lambda handler locally...');
console.log(`Test file: ${mockEvent.testFile}`);
console.log('⏱️  Starting execution...\n');

handler.handler(mockEvent, mockContext)
  .then(result => {
    console.log('\n✅ Test execution completed!');
    console.log('📊 Results:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n🎉 All tests passed!');
      if (result.cost) {
        console.log(`💰 Estimated cost: ${result.cost.totalCostINR}`);
      }
    } else {
      console.log('\n❌ Tests failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n💥 Handler execution failed:');
    console.error(error);
    process.exit(1);
  });
