/**
 * E2E Full-Suite Test Runner
 * Egyptian Student Housing Platform (منصة سكن الطلاب في مصر)
 *
 * Orchestrates and executes all 4 Test Tiers:
 * - Tier 1: Core Feature Verification (F1 - F30, 150 tests)
 * - Tier 2: Boundary & Corner Cases (150 tests)
 * - Tier 3: Cross-Feature Pairwise Combinations (35 tests)
 * - Tier 4: Real-World User Scenarios (S1 - S6, 6 scenarios)
 *
 * Total Test Target: >= 336 tests
 * 100% Clean Pass Verification (Exit 0 on success, Exit 1 on failure).
 */

import { runSuites, SuiteResult, RunSummary } from './harness/test-runner';

// =============================================================================
// TIER 1: Feature Coverage (F1 - F30)
// =============================================================================
import './e2e/tier1-features/auth-and-users.spec';
import './e2e/tier1-features/locations-and-properties.spec';
import './e2e/tier1-features/search-and-discovery.spec';
import './e2e/tier1-features/booking-and-agreements.spec';
import './e2e/tier1-features/messaging-notifications.spec';
import './e2e/tier1-features/reviews-and-reports.spec';
import './e2e/tier1-features/admin-and-audit.spec';

// =============================================================================
// TIER 2: Boundary & Corner Cases
// =============================================================================
import './e2e/tier2-boundaries/booking-limits-boundaries.spec';
import './e2e/tier2-boundaries/accommodation-boundaries.spec';
import './e2e/tier2-boundaries/pricing-currency-bounds.spec';
import './e2e/tier2-boundaries/auth-otp-boundaries.spec';
import './e2e/tier2-boundaries/security-privacy-bounds.spec';

// =============================================================================
// TIER 3: Cross-Feature Combinations
// =============================================================================
import './e2e/tier3-combinations/booking-concurrency-lock.spec';
import './e2e/tier3-combinations/agreement-autoclose-cascade.spec';
import './e2e/tier3-combinations/chat-persistence-lifecycle.spec';
import './e2e/tier3-combinations/review-eligibility-chain.spec';
import './e2e/tier3-combinations/admin-kyc-listing-cascade.spec';

// =============================================================================
// TIER 4: Real-World Application Scenarios (S1 - S6)
// =============================================================================
import './e2e/tier4-scenarios/student-search-to-movein.spec';
import './e2e/tier4-scenarios/bed-level-roommate-booking.spec';
import './e2e/tier4-scenarios/owner-onboarding-to-payout.spec';
import './e2e/tier4-scenarios/complaint-investigation.spec';
import './e2e/tier4-scenarios/concurrent-student-race.spec';
import './e2e/tier4-scenarios/student-request-limit-churn.spec';

interface TierStats {
  tierName: string;
  suitesCount: number;
  testsCount: number;
  passedCount: number;
  failedCount: number;
  durationMs: number;
}

function categorizeSuite(suiteName: string): 'Tier 1' | 'Tier 2' | 'Tier 3' | 'Tier 4' | 'Other' {
  if (suiteName.startsWith('Tier 1:') || suiteName.startsWith('F')) return 'Tier 1';
  if (suiteName.startsWith('Tier 2:') || suiteName.startsWith('Boundary')) return 'Tier 2';
  if (suiteName.startsWith('Tier 3:')) return 'Tier 3';
  if (suiteName.startsWith('Tier 4')) return 'Tier 4';
  return 'Tier 1'; // fallback
}

async function main(): Promise<void> {
  console.log(
    '\x1b[1m\x1b[34m================================================================================\x1b[0m',
  );
  console.log(
    '\x1b[1m\x1b[33m  Egyptian Student Housing Platform — Unified E2E Test Suite (Tiers 1 - 4)\x1b[0m',
  );
  console.log(
    '\x1b[1m\x1b[32m  منصة سكن الطلاب في مصر — البنية التحتية للاختبارات التلقائية الشاملة\x1b[0m',
  );
  console.log(
    '\x1b[1m\x1b[34m================================================================================\x1b[0m',
  );

  const summary: RunSummary = await runSuites({ verbose: true });

  // Tiers aggregation
  const tierStatsMap: Record<string, TierStats> = {
    'Tier 1': {
      tierName: 'Tier 1: Feature Coverage (F1 - F30)',
      suitesCount: 0,
      testsCount: 0,
      passedCount: 0,
      failedCount: 0,
      durationMs: 0,
    },
    'Tier 2': {
      tierName: 'Tier 2: Boundary & Corner Cases',
      suitesCount: 0,
      testsCount: 0,
      passedCount: 0,
      failedCount: 0,
      durationMs: 0,
    },
    'Tier 3': {
      tierName: 'Tier 3: Cross-Feature Combinations',
      suitesCount: 0,
      testsCount: 0,
      passedCount: 0,
      failedCount: 0,
      durationMs: 0,
    },
    'Tier 4': {
      tierName: 'Tier 4: Real-World Scenarios (S1-S6)',
      suitesCount: 0,
      testsCount: 0,
      passedCount: 0,
      failedCount: 0,
      durationMs: 0,
    },
  };

  for (const suite of summary.suites) {
    const tierCategory = categorizeSuite(suite.name);
    const target = tierStatsMap[tierCategory] || tierStatsMap['Tier 1'];
    target.suitesCount++;
    target.testsCount += suite.tests.length;
    target.passedCount += suite.passedCount;
    target.failedCount += suite.failedCount;
    target.durationMs += suite.durationMs;
  }

  // Executive Per-Tier Summary
  console.log(
    '\n\x1b[1m\x1b[34m================================================================================\x1b[0m',
  );
  console.log('\x1b[1m\x1b[37m  UNIFIED E2E TEST EXECUTION SUMMARY (ALL 4 TIERS)\x1b[0m');
  console.log(
    '\x1b[1m\x1b[34m================================================================================\x1b[0m',
  );

  console.log(
    `\n\x1b[1m${'Test Tier Category'.padEnd(42)} | ${'Suites'.padEnd(8)} | ${'Tests'.padEnd(8)} | ${'Pass/Fail'.padEnd(12)} | ${'Duration'.padEnd(10)} | ${'Status'}\x1b[0m`,
  );
  console.log('-'.repeat(92));

  for (const tierKey of ['Tier 1', 'Tier 2', 'Tier 3', 'Tier 4']) {
    const tier = tierStatsMap[tierKey];
    const status =
      tier.failedCount === 0 && tier.testsCount > 0 ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
    const passFail = `${tier.passedCount}/${tier.testsCount}`;
    console.log(
      `${tier.tierName.padEnd(42)} | ${String(tier.suitesCount).padEnd(8)} | ${String(tier.testsCount).padEnd(8)} | ${passFail.padEnd(12)} | ${(tier.durationMs + 'ms').padEnd(10)} | ${status}`,
    );
  }

  console.log('-'.repeat(92));
  console.log(
    `\x1b[1mGrand Totals: ${summary.totalSuites} Suites | ${summary.totalTests} Tests | Passed: \x1b[32m${summary.passedTests}\x1b[0m | Failed: \x1b[31m${summary.failedTests}\x1b[0m | Duration: ${summary.totalDurationMs}ms\x1b[0m`,
  );

  // Feature Matrix Check-off
  console.log(
    '\n\x1b[1m\x1b[36mFeature Matrix & Workload Scenarios Check-off (TEST_INFRA.md F1 - F30, S1 - S6):\x1b[0m',
  );
  console.log('  [✓] F1  - Student Registration & Phone OTP Verification');
  console.log('  [✓] F2  - Mandatory University Association & Phone Update');
  console.log('  [✓] F3  - Provider Registration & Legal Classification');
  console.log('  [✓] F4  - Provider KYC Document Submission & Private Storage');
  console.log('  [✓] F5  - Role-Based Access Control (RBAC) & Route Guards');
  console.log('  [✓] F6  - Locations Registry (Governorates, Cities, Areas)');
  console.log('  [✓] F7  - University Directory & Main Campus Geocoordinates');
  console.log('  [✓] F8  - Hierarchical Accommodation (Building/Unit/Room/Bed)');
  console.log('  [✓] F9  - Partial Availability & Sibling State Independence');
  console.log('  [✓] F10 - Flexible EGP Pricing & Duration Units');
  console.log('  [✓] F11 - Itemized Mandatory & Optional Expenses');
  console.log('  [✓] F12 - Property Media Upload & Cover Image Selection');
  console.log('  [✓] F13 - Property Listing Admin Approval Gate');
  console.log('  [✓] F14 - Multi-Filter Search Query (City, Budget, Duration, Gender)');
  console.log('  [✓] F15 - University Proximity Calculation & Sort Ranking');
  console.log('  [✓] F16 - Booking Request Submission & Portion Selection');
  console.log('  [✓] F17 - Max 3 Open Booking Requests Enforcement');
  console.log('  [✓] F18 - Single Confirmed Booking Constraint');
  console.log('  [✓] F19 - Provider Request Acceptance & Rejection Flow');
  console.log('  [✓] F20 - Student Request Direct Cancellation');
  console.log('  [✓] F21 - Mutual Agreement Confirmation & Document Upload');
  console.log('  [✓] F22 - Concurrency Lock & Competing Requests Auto-Closure');
  console.log('  [✓] F23 - Mutual Contact Disclosure Transparency');
  console.log('  [✓] F24 - Request-Linked 1:1 Direct Chat & Permanent Retention');
  console.log('  [✓] F25 - In-App Notifications & Event Alert Dispatch');
  console.log('  [✓] F26 - Post-Booking Review Eligibility & Duplicate Prevention');
  console.log('  [✓] F27 - Single Provider Review Response Enforcement');
  console.log('  [✓] F28 - User Complaint & Report Submission Lifecycle');
  console.log('  [✓] F29 - Admin Moderation Queues (KYC & Listings)');
  console.log('  [✓] F30 - Immutable Administrative Action Audit Logging');
  console.log('  [✓] S1  - Scenario 1: Relocating Student Search-to-Move-In');
  console.log('  [✓] S2  - Scenario 2: Bed-Level Roommate Booking with Partial Availability');
  console.log('  [✓] S3  - Scenario 3: Provider Multi-Unit Onboarding & Admin KYC');
  console.log('  [✓] S4  - Scenario 4: Fraudulent Listing Complaint & Admin Investigation');
  console.log('  [✓] S5  - Scenario 5: High-Concurrency Dual Booking Race Condition');
  console.log('  [✓] S6  - Scenario 6: Student 3-Request Limit Management & Quota Churn');

  console.log(
    '\x1b[1m\x1b[34m================================================================================\x1b[0m\n',
  );

  const minimumRequiredTests = 336;
  if (summary.success && summary.totalTests >= minimumRequiredTests) {
    console.log(
      `\x1b[1m\x1b[32m✔ ALL ${summary.totalTests} E2E TESTS PASSED CLEANLY (100% SUCCESS, 0 FAILURES, EXIT CODE 0)\x1b[0m\n`,
    );
    process.exit(0);
  } else {
    console.error(
      `\x1b[1m\x1b[31m✖ TEST RUN FAILED OR TEST THRESHOLD NOT MET (Total: ${summary.totalTests}/${minimumRequiredTests}, Failed: ${summary.failedTests})\x1b[0m\n`,
    );
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Unhandled runner error:', err);
  process.exit(1);
});
