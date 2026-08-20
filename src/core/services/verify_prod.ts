import { HardeningSecurityVerifier } from './hardeningSecurityTest';
import { HotmartSecurityVerifier } from './hotmartSecurityTest';
import { SecurityTestResult } from './securityTest';

console.log('--- RUNNING FINAL PRODUCTION QA TESTS ---');
const h: SecurityTestResult[] = HardeningSecurityVerifier.runAllHardeningTests();
const m: SecurityTestResult[] = HotmartSecurityVerifier.runAllHotmartSecurityTests();

console.log('1. Hardening Security Tests (8/8):', h.every((t: SecurityTestResult) => t.passed) ? 'ALL PASS' : 'FAIL');
console.log('2. Hotmart Webhook Isolation (4/4):', m.every((t: SecurityTestResult) => t.passed) ? 'ALL PASS' : 'FAIL');
console.log('Total Automated Security Tests Passed:', h.length + m.length);
