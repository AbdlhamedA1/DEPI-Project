/**
 * Standalone TypeScript Test Runner & Assertion Engine
 * Zero external dependencies.
 * Provides describe, it/test, before/after hooks, rich assertions,
 * and comprehensive test metrics reporting with exit codes.
 */

export interface TestResult {
  name: string;
  passed: boolean;
  durationMs: number;
  error?: Error;
}

export interface SuiteResult {
  name: string;
  tests: TestResult[];
  passedCount: number;
  failedCount: number;
  durationMs: number;
}

export interface RunSummary {
  totalSuites: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  totalDurationMs: number;
  success: boolean;
  suites: SuiteResult[];
}

type HookFn = () => void | Promise<void>;
type TestFn = () => void | Promise<void>;

interface TestDefinition {
  name: string;
  fn: TestFn;
}

interface SuiteDefinition {
  name: string;
  parent?: SuiteDefinition;
  beforeAllHooks: HookFn[];
  afterAllHooks: HookFn[];
  beforeEachHooks: HookFn[];
  afterEachHooks: HookFn[];
  tests: TestDefinition[];
}

// Global registry of suites
const registeredSuites: SuiteDefinition[] = [];
let currentSuite: SuiteDefinition | null = null;

export function describe(suiteName: string, fn: () => void): void {
  const suite: SuiteDefinition = {
    name: suiteName,
    parent: currentSuite ?? undefined,
    beforeAllHooks: [],
    afterAllHooks: [],
    beforeEachHooks: [],
    afterEachHooks: [],
    tests: [],
  };

  const previousSuite = currentSuite;
  currentSuite = suite;
  registeredSuites.push(suite);

  try {
    fn();
  } finally {
    currentSuite = previousSuite;
  }
}

export function it(testName: string, fn: TestFn): void {
  if (!currentSuite) {
    throw new Error(`Test "${testName}" must be inside a describe() suite.`);
  }
  currentSuite.tests.push({ name: testName, fn });
}

export const test = it;

export function beforeAll(fn: HookFn): void {
  if (!currentSuite) throw new Error('beforeAll must be inside a describe block.');
  currentSuite.beforeAllHooks.push(fn);
}

export function afterAll(fn: HookFn): void {
  if (!currentSuite) throw new Error('afterAll must be inside a describe block.');
  currentSuite.afterAllHooks.push(fn);
}

export function beforeEach(fn: HookFn): void {
  if (!currentSuite) throw new Error('beforeEach must be inside a describe block.');
  currentSuite.beforeEachHooks.push(fn);
}

export function afterEach(fn: HookFn): void {
  if (!currentSuite) throw new Error('afterEach must be inside a describe block.');
  currentSuite.afterEachHooks.push(fn);
}

export function clearSuites(): void {
  registeredSuites.length = 0;
  currentSuite = null;
}

// Deep equality helper
function isDeepEqual(a: any, b: any): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
    return false;
  }
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!isDeepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!isDeepEqual(a[key], b[key])) return false;
  }
  return true;
}

// Assertion Matcher Interface
export interface Matchers<T = any> {
  toBe(expected: any): void;
  toEqual(expected: any): void;
  toBeDefined(): void;
  toBeUndefined(): void;
  toBeNull(): void;
  toBeTruthy(): void;
  toBeFalsy(): void;
  toBeGreaterThan(n: number): void;
  toBeLessThan(n: number): void;
  toBeGreaterThanOrEqual(n: number): void;
  toBeLessThanOrEqual(n: number): void;
  toContain(itemOrSubstr: any): void;
  toHaveLength(length: number): void;
  toMatch(regex: RegExp): void;
  toThrow(expectedError?: string | RegExp): void;
  not: Matchers<T>;
}

export function expect<T = any>(actual: T): Matchers<T> {
  const createMatchers = (isNot: boolean): Matchers<T> => ({
    toBe(expected: any) {
      const pass = Object.is(actual, expected);
      if (isNot ? pass : !pass) {
        throw new Error(
          `Expected ${JSON.stringify(actual)} ${isNot ? 'NOT to be' : 'to be'} ${JSON.stringify(expected)}`,
        );
      }
    },
    toEqual(expected: any) {
      const pass = isDeepEqual(actual, expected);
      if (isNot ? pass : !pass) {
        throw new Error(
          `Expected ${JSON.stringify(actual)} ${isNot ? 'NOT to deeply equal' : 'to deeply equal'} ${JSON.stringify(expected)}`,
        );
      }
    },
    toBeDefined() {
      const pass = actual !== undefined;
      if (isNot ? pass : !pass) {
        throw new Error(
          `Expected value ${isNot ? 'to be undefined' : 'to be defined'}, but got ${JSON.stringify(actual)}`,
        );
      }
    },
    toBeUndefined() {
      const pass = actual === undefined;
      if (isNot ? pass : !pass) {
        throw new Error(
          `Expected value ${isNot ? 'NOT to be undefined' : 'to be undefined'}, but got ${JSON.stringify(actual)}`,
        );
      }
    },
    toBeNull() {
      const pass = actual === null;
      if (isNot ? pass : !pass) {
        throw new Error(
          `Expected value ${isNot ? 'NOT to be null' : 'to be null'}, but got ${JSON.stringify(actual)}`,
        );
      }
    },
    toBeTruthy() {
      const pass = Boolean(actual);
      if (isNot ? pass : !pass) {
        throw new Error(
          `Expected value ${isNot ? 'NOT to be truthy' : 'to be truthy'}, but got ${JSON.stringify(actual)}`,
        );
      }
    },
    toBeFalsy() {
      const pass = !actual;
      if (isNot ? pass : !pass) {
        throw new Error(
          `Expected value ${isNot ? 'NOT to be falsy' : 'to be falsy'}, but got ${JSON.stringify(actual)}`,
        );
      }
    },
    toBeGreaterThan(n: number) {
      const pass = typeof actual === 'number' && actual > n;
      if (isNot ? pass : !pass) {
        throw new Error(`Expected ${actual} ${isNot ? 'NOT to be >' : 'to be >'} ${n}`);
      }
    },
    toBeLessThan(n: number) {
      const pass = typeof actual === 'number' && actual < n;
      if (isNot ? pass : !pass) {
        throw new Error(`Expected ${actual} ${isNot ? 'NOT to be <' : 'to be <'} ${n}`);
      }
    },
    toBeGreaterThanOrEqual(n: number) {
      const pass = typeof actual === 'number' && actual >= n;
      if (isNot ? pass : !pass) {
        throw new Error(`Expected ${actual} ${isNot ? 'NOT to be >=' : 'to be >='} ${n}`);
      }
    },
    toBeLessThanOrEqual(n: number) {
      const pass = typeof actual === 'number' && actual <= n;
      if (isNot ? pass : !pass) {
        throw new Error(`Expected ${actual} ${isNot ? 'NOT to be <=' : 'to be <='} ${n}`);
      }
    },
    toContain(itemOrSubstr: any) {
      let pass = false;
      if (Array.isArray(actual)) {
        pass = actual.some(elem => isDeepEqual(elem, itemOrSubstr));
      } else if (typeof actual === 'string') {
        pass = actual.includes(String(itemOrSubstr));
      } else if (actual instanceof Set || actual instanceof Map) {
        pass = actual.has(itemOrSubstr);
      }
      if (isNot ? pass : !pass) {
        throw new Error(
          `Expected collection ${isNot ? 'NOT to contain' : 'to contain'} ${JSON.stringify(itemOrSubstr)}`,
        );
      }
    },
    toHaveLength(expectedLen: number) {
      const len = (actual as any)?.length;
      const pass = len === expectedLen;
      if (isNot ? pass : !pass) {
        throw new Error(
          `Expected length ${isNot ? 'NOT to be' : 'to be'} ${expectedLen}, but was ${len}`,
        );
      }
    },
    toMatch(regex: RegExp) {
      const pass = typeof actual === 'string' && regex.test(actual);
      if (isNot ? pass : !pass) {
        throw new Error(`Expected "${actual}" ${isNot ? 'NOT to match' : 'to match'} ${regex}`);
      }
    },
    toThrow(expectedError?: string | RegExp) {
      if (typeof actual !== 'function') {
        throw new Error(`expect(fn).toThrow() requires fn to be a function`);
      }
      let threw = false;
      let thrownError: any = null;
      try {
        (actual as any)();
      } catch (err) {
        threw = true;
        thrownError = err;
      }
      if (isNot) {
        if (threw) {
          throw new Error(
            `Expected function NOT to throw, but it threw: ${thrownError?.message || thrownError}`,
          );
        }
        return;
      }
      if (!threw) {
        throw new Error(`Expected function to throw, but it did not throw any error`);
      }
      if (expectedError) {
        const msg = thrownError?.message || String(thrownError);
        if (typeof expectedError === 'string' && !msg.includes(expectedError)) {
          throw new Error(`Expected error message to include "${expectedError}", but got "${msg}"`);
        }
        if (expectedError instanceof RegExp && !expectedError.test(msg)) {
          throw new Error(`Expected error message to match ${expectedError}, but got "${msg}"`);
        }
      }
    },
    get not(): Matchers<T> {
      return createMatchers(!isNot);
    },
  });

  return createMatchers(false);
}

// Collect hooks from root ancestor down to current suite
function getBeforeEachHooks(suite: SuiteDefinition): HookFn[] {
  const hooks: HookFn[] = [];
  let curr: SuiteDefinition | undefined = suite;
  while (curr) {
    hooks.unshift(...curr.beforeEachHooks);
    curr = curr.parent;
  }
  return hooks;
}

function getAfterEachHooks(suite: SuiteDefinition): HookFn[] {
  const hooks: HookFn[] = [];
  let curr: SuiteDefinition | undefined = suite;
  while (curr) {
    hooks.push(...curr.afterEachHooks);
    curr = curr.parent;
  }
  return hooks;
}

// Suite Execution Engine
export async function runSuites(options?: {
  verbose?: boolean;
  filter?: string;
}): Promise<RunSummary> {
  const verbose = options?.verbose ?? true;
  const filter = options?.filter;
  const suiteResults: SuiteResult[] = [];
  const overallStart = Date.now();

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  for (const suite of registeredSuites) {
    if (filter && !suite.name.toLowerCase().includes(filter.toLowerCase())) {
      continue;
    }

    if (suite.tests.length === 0) {
      continue;
    }

    if (verbose) {
      console.log(`\n\x1b[1m\x1b[36m▶ Suite: ${suite.name}\x1b[0m`);
    }

    const suiteStart = Date.now();
    const testResults: TestResult[] = [];
    let suitePassed = 0;
    let suiteFailed = 0;

    // Run beforeAll hooks
    for (const hook of suite.beforeAllHooks) {
      await hook();
    }

    const allBeforeEach = getBeforeEachHooks(suite);
    const allAfterEach = getAfterEachHooks(suite);

    for (const testCase of suite.tests) {
      totalTests++;
      const testStart = Date.now();
      let testPassed = false;
      let testError: Error | undefined;

      try {
        // Run beforeEach hooks
        for (const hook of allBeforeEach) {
          await hook();
        }

        // Run test
        await testCase.fn();

        // Run afterEach hooks
        for (const hook of allAfterEach) {
          await hook();
        }

        testPassed = true;
        suitePassed++;
        passedTests++;
      } catch (err: any) {
        testPassed = false;
        testError = err instanceof Error ? err : new Error(String(err));
        suiteFailed++;
        failedTests++;
      }

      const testDuration = Date.now() - testStart;
      testResults.push({
        name: testCase.name,
        passed: testPassed,
        durationMs: testDuration,
        error: testError,
      });

      if (verbose) {
        if (testPassed) {
          console.log(`  \x1b[32m✓\x1b[0m ${testCase.name} \x1b[90m(${testDuration}ms)\x1b[0m`);
        } else {
          console.log(
            `  \x1b[31m✗\x1b[0m \x1b[1m${testCase.name}\x1b[0m \x1b[90m(${testDuration}ms)\x1b[0m`,
          );
          if (testError) {
            console.log(`    \x1b[31mError: ${testError.message}\x1b[0m`);
            if (testError.stack) {
              const stackLines = testError.stack
                .split('\n')
                .slice(1, 4)
                .map(line => `      ${line}`)
                .join('\n');
              console.log(`\x1b[90m${stackLines}\x1b[0m`);
            }
          }
        }
      }
    }

    // Run afterAll hooks
    for (const hook of suite.afterAllHooks) {
      await hook();
    }

    const suiteDuration = Date.now() - suiteStart;
    suiteResults.push({
      name: suite.name,
      tests: testResults,
      passedCount: suitePassed,
      failedCount: suiteFailed,
      durationMs: suiteDuration,
    });
  }

  const totalDurationMs = Date.now() - overallStart;
  const success = failedTests === 0;

  return {
    totalSuites: suiteResults.length,
    totalTests,
    passedTests,
    failedTests,
    totalDurationMs,
    success,
    suites: suiteResults,
  };
}
