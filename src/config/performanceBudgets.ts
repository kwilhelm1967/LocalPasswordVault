/**
 * Performance Budgets Configuration
 * 
 * Defines performance budgets for rendering, operations, and memory usage.
 */

export interface PerformanceBudgets {
  render: {
    mount: number; // ms
    update: number; // ms
  };
  operation: {
    fast: number; // ms
    normal: number; // ms
    slow: number; // ms
  };
  memory: {
    warning: number; // MB
    critical: number; // MB
  };
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
  },
};

export const getPerformanceBudgets = (): PerformanceBudgets => BUDGETS;

export const checkRenderBudget = (renderTime: number, isMount: boolean): { withinBudget: boolean; budget: number } => {
  const budget = isMount ? BUDGETS.render.mount : BUDGETS.render.update;
  return {
    withinBudget: renderTime <= budget,
    budget,
  };
};

export const checkOperationBudget = (operationTime: number): { withinBudget: boolean; budget: number; category: 'fast' | 'normal' | 'slow' } => {
  let category: 'fast' | 'normal' | 'slow' = 'fast';
  let budget = BUDGETS.operation.fast;
  
  if (operationTime > BUDGETS.operation.slow) {
    category = 'slow';
    budget = BUDGETS.operation.slow;
  } else if (operationTime > BUDGETS.operation.normal) {
    category = 'normal';
    budget = BUDGETS.operation.normal;
  }
  
  return {
    withinBudget: operationTime <= budget,
    budget,
    category,
  };
};

export const checkMemoryBudget = (memoryMB: number): { withinBudget: boolean; budget: number; level: 'ok' | 'warning' | 'critical' } => {
  let level: 'ok' | 'warning' | 'critical' = 'ok';
  let budget = BUDGETS.memory.warning;
  
  if (memoryMB > BUDGETS.memory.critical) {
    level = 'critical';
    budget = BUDGETS.memory.critical;
  } else if (memoryMB > BUDGETS.memory.warning) {
    level = 'warning';
    budget = BUDGETS.memory.warning;
  }
  
  return {
    withinBudget: memoryMB <= budget,
    budget,
    level,
  };
};
