import { createStore } from "solid-js/store";
import { createEffect, createMemo, onCleanup } from "solid-js";
import { createStoredSignal } from "../hooks/createStoredSignal";
import type { 
  OperationState, 
  OperationOutput, 
  OperationResult, 
  OperationStatus,
  MultiInstanceWarning 
} from "../types/operations";

// 操作状态存储
const [operations, setOperations] = createStore<Record<string, OperationState>>({});

// 当前活跃操作数量 - 使用 createMemo 自动计算
const activeOperationsCount = createMemo(() => {
  return Object.values(operations).filter(op => 
    op.status === 'in-progress' || op.isMinimized
  ).length;
});

// 多实例警告配置 - 使用持久化存储
const [multiInstanceWarning, setMultiInstanceWarning] = createStoredSignal<MultiInstanceWarning>('multiInstanceWarning', {
  enabled: true,
  threshold: 2,
  dismissed: false
});

// 生成唯一操作ID
export const generateOperationId = (operationType: string): string => {
  return `${operationType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// 操作管理 Hook
export const useOperations = () => {
  // 添加新操作
  const addOperation = (operation: Omit<OperationState, 'createdAt' | 'updatedAt'>) => {
    const now = Date.now();
    const newOperation: OperationState = {
      ...operation,
      createdAt: now,
      updatedAt: now
    };

    setOperations(newOperation.id, newOperation);
    // 活跃操作数量会通过 createMemo 自动更新
    
    // 检查是否需要显示多实例警告
    checkMultiInstanceWarning();
  };

  // 移除操作
  const removeOperation = (id: string) => {
    setOperations(id, undefined as any);
    // 活跃操作数量会通过 createMemo 自动更新
  };

  // 更新操作状态
  const updateOperation = (id: string, updates: Partial<OperationState>) => {
    setOperations(id, {
      ...updates,
      updatedAt: Date.now()
    });
  };

  // 添加操作输出 - 优化性能，减少数组创建
  const addOperationOutput = (operationId: string, output: Omit<OperationOutput, 'timestamp'>) => {
    const timestamp = Date.now();
    const newOutput: OperationOutput = { ...output, timestamp };
    
    setOperations(operationId, 'output', (prev = []) => {
      // 如果接近限制，直接创建新数组并截断
      if (prev.length >= 950) { // 提前处理，避免频繁达到1000限制
        const updated = prev.slice(-50); // 保留最后50条
        updated.push(newOutput);
        return updated;
      }
      // 正常情况下直接添加
      return [...prev, newOutput];
    });
  };

  // 设置操作结果
  const setOperationResult = (operationId: string, result: OperationResult) => {
    updateOperation(operationId, {
      status: result.success ? 'success' : 'error',
      result
    });
  };

  // 切换最小化状态
  const toggleMinimize = (operationId: string) => {
    const operation = operations[operationId];
    if (operation) {
      updateOperation(operationId, {
        isMinimized: !operation.isMinimized
      });
    }
  };

  // 设置操作状态
  const setOperationStatus = (operationId: string, status: OperationStatus) => {
    updateOperation(operationId, { status });
  };

  // 获取活跃操作
  const getActiveOperations = () => {
    return Object.values(operations).filter(op => 
      op.status === 'in-progress' || op.isMinimized
    );
  };

  // 更新活跃操作数量 - 已移除，使用 createMemo 自动计算

  // 检查多实例警告
  const checkMultiInstanceWarning = () => {
    const warning = multiInstanceWarning();
    const activeCount = activeOperationsCount(); // 使用计算属性
    
    if (warning.enabled && !warning.dismissed && activeCount >= warning.threshold) {
      return true;
    }
    return false;
  };

  // 忽略多实例警告
  const dismissMultiInstanceWarning = () => {
    setMultiInstanceWarning((prev: MultiInstanceWarning) => ({ ...prev, dismissed: true }));
  };

  // 更新多实例警告配置
  const updateMultiInstanceWarning = (updates: Partial<MultiInstanceWarning>) => {
    setMultiInstanceWarning((prev: MultiInstanceWarning) => ({ ...prev, ...updates }));
  };

  // 清理已完成操作
  const cleanupCompletedOperations = () => {
    const now = Date.now();
    const cleanupThreshold = 5 * 60 * 1000; // 5分钟

    Object.entries(operations).forEach(([id, operation]) => {
      if (
        (operation.status === 'success' || operation.status === 'error') &&
        now - operation.updatedAt > cleanupThreshold
      ) {
        removeOperation(id);
      }
    });
  };

  // 定期清理 - 修复内存泄漏问题
  createEffect(() => {
    const cleanupInterval = setInterval(cleanupCompletedOperations, 60000); // 每分钟清理一次
    
    onCleanup(() => {
      clearInterval(cleanupInterval);
    });
  });

  return {
    // 状态
    operations: () => operations,
    activeOperationsCount,
    multiInstanceWarning,

    // 操作方法
    addOperation,
    removeOperation,
    updateOperation,
    addOperationOutput,
    setOperationResult,
    toggleMinimize,
    setOperationStatus,
    getActiveOperations,

    // 警告管理
    checkMultiInstanceWarning,
    dismissMultiInstanceWarning,
    updateMultiInstanceWarning,

    // 工具方法
    generateOperationId,
    cleanupCompletedOperations
  };
};

