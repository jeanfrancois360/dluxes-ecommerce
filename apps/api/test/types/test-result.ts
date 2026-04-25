/**
 * Shared types for backend test agents
 */

export interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  duration: number;
  error?: string;
  details?: any;
}

export interface AgentTestResults {
  agentName: string;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  totalDuration: number;
  tests: TestResult[];
}

export interface TestContext {
  baseUrl: string;
  accessToken?: string;
  adminToken?: string;
  sellerToken?: string;
  buyerToken?: string;
}
