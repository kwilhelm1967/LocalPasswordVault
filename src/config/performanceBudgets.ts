/**
 * Performance Budgets Configuration
 * 
 * Defines performance budgets for rendering, operations, and memory usage.
 * Budget check functions return { exceeds, warning, budget, warningThreshold }
 * to enable tiered alerting in the performance monitor.
 */

export interface PerformanceBudgets {
  render: {
    mount: number; // ms - budget for initial component mount
    update: number; // ms - budget for component updates (target: 60fps)
  };
  operation: {
    fast: number; // ms - budget for fast sync operations
    normal: number; // ms - budget for normal operations
    slow: number; // ms - budget for slow/async operations
  };
  memory: {
    warning: number; // MB - warning threshold
    critical: number; // MB - critical threshold
    maxMemoryGrowthMB: number; // MB/min - max acceptable memory growth rate
  };
}

/** Result returned by all budget check functions */
export interface BudgetCheckResult {
  /** True if the metric exceeds the hard budget limit */
  exceeds: boolean;
  /** True if the metric exceeds the warning threshold (80% of budget) but not the limit */
  warning: boolean;
  /** The hard budget limit */
  budget: number;
  /** The warning threshold (80% of budget) */
  warningThreshold: number;
}

const BUDGETS: PerformanceBudgets = {
  render: {
    mount: 100, // 100ms for initial mount
    update: 16, // 16ms for updates (60fps)
  },
  operation: {
    fast: 10, // 10ms
    normal: 100, // 100ms
    slow: 1000, // 1s
  },
  memory: {
    warning: 100, // 100MB
    critical: 500, // 500MB
    maxMemoryGrowthMB: 5, // 5MB/min max growth before leak warning
  },
};

export const getPerformanceBudgets = (): PerformanceBudgets => BUDGETS;

/**
 * Check render time against budget.
 * Uses mount budget for initial renders, update budget for re-renders.
 * Warning threshold is 80% of the budget.
 */
export const checkRenderBudget = (renderTime: number, isMount: boolean): BudgetCheckResult => {
  const budget = isMount ? BUDGETS.render.mount : BUDGETS.render.update;
  const warningThreshold = budget * 0.8;
  return {
    exceeds: renderTime > budget,
    warning: renderTime > warningThreshold && renderTime <= budget,
    budget,
    warningThreshold,
  };
};

/**
 * Check operation time against budget.
 * Uses the slow (async) budget when isAsync is true, otherwise uses the normal budget.
 * Warning threshold is 80% of the budget.
 */
export const checkOperationBudget = (operationTime: number, isAsync: boolean = false): BudgetCheckResult => {
  const budget = isAsync ? BUDGETS.operation.slow : BUDGETS.operation.normal;
  const warningThreshold = budget * 0.8;
  return {
    exceeds: operationTime > budget,
    warning: operationTime > warningThreshold && operationTime <= budget,
    budget,
    warningThreshold,
  };
};

/**
 * Check memory usage against budget.
 * Warning at the warning threshold, exceeds at the critical threshold.
 */
export const checkMemoryBudget = (memoryMB: number): BudgetCheckResult => {
  return {
    exceeds: memoryMB > BUDGETS.memory.critical,
    warning: memoryMB > BUDGETS.memory.warning && memoryMB <= BUDGETS.memory.critical,
    budget: BUDGETS.memory.critical,
    warningThreshold: BUDGETS.memory.warning,
  };
};
