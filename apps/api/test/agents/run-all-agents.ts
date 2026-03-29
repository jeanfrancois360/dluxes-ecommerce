#!/usr/bin/env ts-node

/**
 * NextPik Backend Testing Suite - Master Test Runner
 *
 * This orchestrator runs all 8 backend test agents in the optimal sequence:
 * 1. Auth Agent (first, to obtain tokens)
 * 2. Remaining 7 agents in parallel (Product, Cart/Order, Referral, Seller, Admin, Shipping, Settings)
 *
 * Usage:
 *   cd apps/api
 *   npx ts-node test/agents/run-all-agents.ts
 *
 * Requirements:
 *   - Backend server running on http://localhost:4000
 *   - Database seeded with test data
 *   - All environment variables configured
 */

import { AuthAgent } from './auth.agent';
import { ProductAgent } from './product.agent';
import { CartOrderAgent } from './cart-order.agent';
import { ReferralAgent } from './referral.agent';
import { SellerAgent } from './seller.agent';
import { AdminAgent } from './admin.agent';
import { ShippingAgent } from './shipping.agent';
import { SettingsAgent } from './settings.agent';

// Use the TestResult interface from the agents
interface TestResult {
  test: string;
  status: 'pass' | 'fail' | 'warn' | 'skip';
  message?: string;
  duration?: number;
  error?: any;
}

interface AgentResult {
  agentName: string;
  results: TestResult[];
  duration: number;
  error?: string;
}

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

/**
 * Print section header
 */
function printHeader(title: string) {
  console.log('\n' + '='.repeat(80));
  console.log(`${colors.bright}${colors.cyan}${title}${colors.reset}`);
  console.log('='.repeat(80) + '\n');
}

/**
 * Print test result with color
 */
function printTestResult(result: TestResult, indent = '  ') {
  const statusColors = {
    pass: colors.green,
    fail: colors.red,
    warn: colors.yellow,
    skip: colors.blue,
  };

  const statusColor = statusColors[result.status];
  const durationStr = result.duration ? ` (${result.duration}ms)` : '';
  const messageStr = result.message ? ` - ${result.message}` : '';

  console.log(
    `${indent}${statusColor}${result.status.toUpperCase()}${colors.reset} ${result.test}${durationStr}${messageStr}`
  );
}

/**
 * Calculate summary statistics
 */
function calculateStats(allResults: AgentResult[]) {
  let totalTests = 0;
  let passed = 0;
  let failed = 0;
  let warnings = 0;
  let skipped = 0;

  allResults.forEach((agentResult) => {
    agentResult.results.forEach((result) => {
      totalTests++;
      switch (result.status) {
        case 'pass':
          passed++;
          break;
        case 'fail':
          failed++;
          break;
        case 'warn':
          warnings++;
          break;
        case 'skip':
          skipped++;
          break;
      }
    });
  });

  return { totalTests, passed, failed, warnings, skipped };
}

/**
 * Generate comprehensive test report
 */
function generateReport(allResults: AgentResult[], totalDuration: number) {
  printHeader('NEXTPIK BACKEND TEST REPORT');

  // Print results for each agent
  allResults.forEach((agentResult) => {
    console.log(`\n${colors.bright}${colors.magenta}${agentResult.agentName}${colors.reset}`);
    console.log(`Duration: ${agentResult.duration}ms\n`);

    if (agentResult.error) {
      console.log(`  ${colors.red}ERROR: ${agentResult.error}${colors.reset}\n`);
    } else {
      agentResult.results.forEach((result) => printTestResult(result));
    }
  });

  // Calculate statistics
  const stats = calculateStats(allResults);
  const successRate =
    stats.totalTests > 0 ? ((stats.passed / stats.totalTests) * 100).toFixed(2) : '0.00';

  // Print summary
  printHeader('TEST SUMMARY');

  console.log(`Total Tests:    ${colors.bright}${stats.totalTests}${colors.reset}`);
  console.log(`Passed:         ${colors.green}${stats.passed}${colors.reset}`);
  console.log(`Failed:         ${colors.red}${stats.failed}${colors.reset}`);
  console.log(`Warnings:       ${colors.yellow}${stats.warnings}${colors.reset}`);
  console.log(`Skipped:        ${colors.blue}${stats.skipped}${colors.reset}`);
  console.log(`Success Rate:   ${colors.bright}${successRate}%${colors.reset}`);
  console.log(
    `Total Duration: ${colors.bright}${totalDuration}ms${colors.reset} (${(totalDuration / 1000).toFixed(2)}s)`
  );

  // Print final status
  console.log('\n' + '='.repeat(80));
  if (stats.failed === 0) {
    console.log(`${colors.bright}${colors.green}✓ ALL TESTS PASSED${colors.reset}`);
  } else {
    console.log(`${colors.bright}${colors.red}✗ SOME TESTS FAILED${colors.reset}`);
  }
  console.log('='.repeat(80) + '\n');

  return stats.failed === 0;
}

/**
 * Run a single agent with error handling
 */
async function runAgent(AgentClass: any, agentName: string): Promise<AgentResult> {
  const startTime = Date.now();

  try {
    const agent = new AgentClass();
    const results = await agent.runAll();
    const duration = Date.now() - startTime;

    return { agentName, results, duration };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    return {
      agentName,
      results: [],
      duration,
      error: error.message,
    };
  }
}

/**
 * Main test runner
 */
async function runAllAgents() {
  const overallStartTime = Date.now();
  const allResults: AgentResult[] = [];

  console.log(`${colors.bright}${colors.cyan}NextPik Backend Testing Suite${colors.reset}`);
  console.log(`Started at: ${new Date().toISOString()}\n`);

  // ========================================================================
  // PHASE 1: Run Auth Agent (MUST RUN FIRST)
  // ========================================================================
  printHeader('PHASE 1: Authentication Tests');

  console.log('Running AuthAgent to obtain test tokens...\n');
  const authResult = await runAgent(AuthAgent, 'Auth Agent');
  allResults.push(authResult);

  if (authResult.error) {
    console.log(
      `\n${colors.red}CRITICAL: AuthAgent failed. Cannot proceed with other tests.${colors.reset}`
    );
    console.log(`Error: ${authResult.error}\n`);
    generateReport(allResults, Date.now() - overallStartTime);
    process.exit(1);
  }

  console.log(`\n${colors.green}✓ Auth tests completed${colors.reset}`);
  console.log(`  Note: Each agent handles its own authentication independently\n`);

  // ========================================================================
  // PHASE 2: Run Remaining 7 Agents in Parallel
  // ========================================================================
  printHeader('PHASE 2: Parallel Agent Execution');

  console.log('Running 7 agents in parallel (each handles own authentication)...\n');

  const agentPromises = [
    runAgent(ProductAgent, 'Product Agent'),
    runAgent(CartOrderAgent, 'Cart & Order Agent'),
    runAgent(ReferralAgent, 'Referral Agent'),
    runAgent(SellerAgent, 'Seller Agent'),
    runAgent(AdminAgent, 'Admin Agent'),
    runAgent(ShippingAgent, 'Shipping Agent'),
    runAgent(SettingsAgent, 'Settings Agent'),
  ];

  const results = await Promise.allSettled(agentPromises);

  // Process results
  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      allResults.push(result.value);
    } else {
      allResults.push({
        agentName: 'Unknown Agent',
        results: [],
        duration: 0,
        error: result.reason?.message || 'Unknown error',
      });
    }
  });

  console.log(`${colors.green}✓ All agents completed${colors.reset}\n`);

  // ========================================================================
  // PHASE 3: Generate Report
  // ========================================================================
  const totalDuration = Date.now() - overallStartTime;
  const allPassed = generateReport(allResults, totalDuration);

  // Exit with appropriate code
  process.exit(allPassed ? 0 : 1);
}

// ========================================================================
// Entry Point
// ========================================================================
if (require.main === module) {
  runAllAgents().catch((error) => {
    console.error(`${colors.red}Fatal error:${colors.reset}`, error);
    process.exit(1);
  });
}

export { runAllAgents };
