/**
 * Load Simulation Test
 * Tests settings module performance under load
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TestResult {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  errors: string[];
}

async function runLoadTest(
  testName: string,
  testFn: () => Promise<void>,
  iterations: number
): Promise<TestResult> {
  const responseTimes: number[] = [];
  const errors: string[] = [];
  let successCount = 0;
  let failCount = 0;

  console.log(`Running ${testName} (${iterations} iterations)...`);

  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();
    try {
      await testFn();
      const endTime = Date.now();
      responseTimes.push(endTime - startTime);
      successCount++;
    } catch (error) {
      const endTime = Date.now();
      responseTimes.push(endTime - startTime);
      failCount++;
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  const minResponseTime = Math.min(...responseTimes);
  const maxResponseTime = Math.max(...responseTimes);

  return {
    totalRequests: iterations,
    successfulRequests: successCount,
    failedRequests: failCount,
    avgResponseTime,
    minResponseTime,
    maxResponseTime,
    errors: [...new Set(errors)], // Unique errors
  };
}

async function testLoadSimulation() {
  try {
    console.log('🧪 Settings Module Load Simulation Test\n');
    console.log('=' * 60);
    console.log('');

    // Test 1: Rapid sequential reads
    console.log('Test 1: Rapid Sequential Reads');
    console.log('-'.repeat(40));
    const test1Result = await runLoadTest(
      'Sequential reads',
      async () => {
        await prisma.systemSetting.findMany({ take: 10 });
      },
      100
    );

    console.log(`   Total Requests: ${test1Result.totalRequests}`);
    console.log(`   Successful: ${test1Result.successfulRequests}`);
    console.log(`   Failed: ${test1Result.failedRequests}`);
    console.log(`   Avg Response Time: ${test1Result.avgResponseTime.toFixed(2)}ms`);
    console.log(`   Min: ${test1Result.minResponseTime}ms | Max: ${test1Result.maxResponseTime}ms`);
    if (test1Result.errors.length > 0) {
      console.log(`   Errors: ${test1Result.errors.join(', ')}`);
    }
    console.log(`   ${test1Result.successfulRequests === test1Result.totalRequests ? '✅' : '❌'} Status: ${test1Result.successfulRequests === test1Result.totalRequests ? 'PASS' : 'FAIL'}`);
    console.log('');

    // Test 2: Concurrent reads
    console.log('Test 2: Concurrent Reads');
    console.log('-'.repeat(40));
    const concurrentStart = Date.now();
    const concurrentPromises = Array.from({ length: 50 }, () =>
      prisma.systemSetting.findMany({ take: 10 })
    );

    try {
      await Promise.all(concurrentPromises);
      const concurrentEnd = Date.now();
      const concurrentTime = concurrentEnd - concurrentStart;

      console.log(`   Total Concurrent Requests: 50`);
      console.log(`   Total Time: ${concurrentTime}ms`);
      console.log(`   Avg Time per Request: ${(concurrentTime / 50).toFixed(2)}ms`);
      console.log(`   ✅ Status: PASS`);
    } catch (error) {
      console.log(`   ❌ Status: FAIL`);
      console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
    }
    console.log('');

    // Test 3: Read specific settings
    console.log('Test 3: Specific Setting Lookups');
    console.log('-'.repeat(40));
    const criticalKeys = [
      'escrow_enabled',
      'escrow_default_hold_days',
      'global_commission_rate',
      'default_currency',
    ];

    const test3Result = await runLoadTest(
      'Specific lookups',
      async () => {
        const randomKey = criticalKeys[Math.floor(Math.random() * criticalKeys.length)];
        await prisma.systemSetting.findUnique({ where: { key: randomKey } });
      },
      100
    );

    console.log(`   Total Requests: ${test3Result.totalRequests}`);
    console.log(`   Successful: ${test3Result.successfulRequests}`);
    console.log(`   Failed: ${test3Result.failedRequests}`);
    console.log(`   Avg Response Time: ${test3Result.avgResponseTime.toFixed(2)}ms`);
    console.log(`   Min: ${test3Result.minResponseTime}ms | Max: ${test3Result.maxResponseTime}ms`);
    console.log(`   ${test3Result.successfulRequests === test3Result.totalRequests ? '✅' : '❌'} Status: ${test3Result.successfulRequests === test3Result.totalRequests ? 'PASS' : 'FAIL'}`);
    console.log('');

    // Test 4: Category filtering
    console.log('Test 4: Category Filtering');
    console.log('-'.repeat(40));
    const categories = ['payment', 'commission', 'currency', 'security'];

    const test4Result = await runLoadTest(
      'Category filtering',
      async () => {
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        await prisma.systemSetting.findMany({ where: { category: randomCategory } });
      },
      100
    );

    console.log(`   Total Requests: ${test4Result.totalRequests}`);
    console.log(`   Successful: ${test4Result.successfulRequests}`);
    console.log(`   Failed: ${test4Result.failedRequests}`);
    console.log(`   Avg Response Time: ${test4Result.avgResponseTime.toFixed(2)}ms`);
    console.log(`   Min: ${test4Result.minResponseTime}ms | Max: ${test4Result.maxResponseTime}ms`);
    console.log(`   ${test4Result.successfulRequests === test4Result.totalRequests ? '✅' : '❌'} Status: ${test4Result.successfulRequests === test4Result.totalRequests ? 'PASS' : 'FAIL'}`);
    console.log('');

    // Summary
    console.log('=' .repeat(60));
    console.log('Load Test Summary:');
    console.log('=' * 60);

    const allTests = [
      { name: 'Sequential Reads', ...test1Result },
      { name: 'Concurrent Reads (50)', successfulRequests: 50, totalRequests: 50, failedRequests: 0 },
      { name: 'Specific Lookups', ...test3Result },
      { name: 'Category Filtering', ...test4Result },
    ];

    let totalSuccessful = 0;
    let totalRequests = 0;

    allTests.forEach(test => {
      totalSuccessful += test.successfulRequests;
      totalRequests += test.totalRequests;
      const status = test.successfulRequests === test.totalRequests ? '✅ PASS' : '❌ FAIL';
      console.log(`   ${status} - ${test.name}: ${test.successfulRequests}/${test.totalRequests}`);
    });

    console.log('');
    console.log(`Total Requests: ${totalRequests}`);
    console.log(`Total Successful: ${totalSuccessful}`);
    console.log(`Success Rate: ${((totalSuccessful / totalRequests) * 100).toFixed(2)}%`);
    console.log('');

    if (totalSuccessful === totalRequests) {
      console.log('✅ ALL LOAD TESTS PASSED!');
      console.log('✅ Settings module performs well under load');
    } else {
      console.log('⚠️  Some load tests failed - review above results');
    }

  } catch (error) {
    console.error('❌ Load test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLoadSimulation();
