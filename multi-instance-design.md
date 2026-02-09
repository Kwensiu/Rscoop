# 多实例 OperationModal 设计方案

## 🎯 设计目标
允许多个 OperationModal 同时运行，提供良好的用户体验，同时适当提醒用户多实例的潜在问题。

## 🏗️ 核心架构思路

### 1. **操作唯一标识系统**
```typescript
// 为每个操作生成唯一 ID
const operationId = `${operationType}-${Date.now()}-${Math.random()}`;

// 事件携带操作 ID
emit('operation-output', {
  operationId,
  line: "...",
  source: "stdout"
});
```

### 2. **事件过滤机制**
```typescript
// 每个实例只监听属于自己的事件
outputListener = await listen<OperationOutput>("operation-output", (event) => {
  if (event.payload.operationId === currentOperationId) {
    setOutput(prev => [...prev, event.payload]);
  }
});
```

### 3. **多实例状态管理**
```typescript
// 移除全局 activeModalId，改为实例管理
// 每个实例独立管理自己的生命周期
const [isActive, setIsActive] = createSignal(true);
```

### 4. **智能布局系统**
```typescript
// MinimizedIndicator 支持多个实例的垂直排列
const [minimizedInstances, setMinimizedInstances] = createSignal<MinimizedInstance[]>([]);

// 动态计算位置
const calculatePosition = (index: number) => ({
  bottom: `${4 + index * 60}px`, // 每个间隔 60px
  left: '4px'
});
```

## 🎨 用户界面改进

### 1. **多实例指示器布局**
- 第一个指示器：`bottom: 16px, left: 16px`
- 第二个指示器：`bottom: 76px, left: 16px`
- 第三个指示器：`bottom: 136px, left: 16px`
- 超过屏幕高度时：水平排列或堆叠显示

### 2. **用户提醒机制**
```typescript
// 当检测到多个活跃操作时显示提醒
const showMultiInstanceWarning = () => {
  if (activeOperationsCount > 1) {
    return (
      <div class="alert alert-warning">
        <span>⚠️ 多个操作同时运行可能影响性能和稳定性</span>
      </div>
    );
  }
};
```

### 3. **操作状态概览**
```typescript
// 在设置页面或状态栏显示当前活跃操作数量
const ActiveOperationsIndicator = () => (
  <div class="badge badge-info">
    活跃操作: {activeOperationsCount}
  </div>
);
```

## 🔧 具体实现步骤

### 第一步：重构事件系统
- 修改后端事件，添加 `operationId` 字段
- 前端实例只处理属于自己的事件
- 清理全局事件监听冲突

### 第二步：实现智能布局
- 创建 `MinimizedIndicatorManager` 组件
- 管理所有最小化实例的位置和状态
- 处理屏幕边界检测和自动调整

### 第三步：添加用户提醒
- 在第二个操作开始时显示非阻塞警告
- 在设置中添加"多实例警告"开关
- 提供操作队列管理界面

### 第四步：优化性能
- 限制同时运行的最大操作数量（建议 3-5 个）
- 实现操作优先级机制
- 添加资源使用监控

## 💡 用户体验优化

### 1. **操作预览**
- 最小化指示器显示操作进度百分比
- 支持悬停显示详细信息
- 快捷操作按钮（暂停/取消）

### 2. **智能分组**
- 相同类型的操作可以分组显示
- 批量操作支持（如"全部更新"的子任务）
- 操作依赖关系管理

### 3. **恢复策略**
- 支持操作历史记录
- 异常中断后的操作恢复
- 操作结果持久化

## 🚨 用户提醒策略

### 何时提醒：
- 启动第二个操作时
- 同时运行超过 3 个操作时
- 检测到系统资源紧张时

### 提醒方式：
- 非阻塞的提示条
- 设置页面的警告说明
- 操作确认对话框中的提醒

## 🎯 多实例最小化指示器布局设计

### 当前实现分析
```css
/* 当前的 MinimizedIndicator CSS */
.fixed.bottom-4.left-4 {
  position: fixed;
  bottom: 1rem;  /* 16px */
  left: 1rem;    /* 16px */
  z-index: 50;
}
```

### 问题分析
1. **硬编码位置**: 使用固定的 `bottom-4 left-4`，无法支持多实例
2. **重叠风险**: 多个实例会完全重叠
3. **无动态调整**: 缺乏位置计算和重新排列机制

### 最佳实践方案

#### 1. **CSS Grid + Flexbox 混合布局**
```css
/* 容器使用 Flexbox 垂直排列 */
.minimized-indicators-container {
  position: fixed;
  bottom: 1rem;
  left: 1rem;
  display: flex;
  flex-direction: column-reverse; /* 从下往上排列 */
  gap: 0.5rem;
  z-index: 50;
  pointer-events: none; /* 容器不拦截事件 */
}

/* 单个指示器 */
.minimized-indicator {
  pointer-events: auto; /* 恢复事件拦截 */
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform, opacity; /* 优化动画性能 */
}
```

#### 2. **CSS 自定义属性动态计算**
```css
.minimized-indicator {
  /* 使用 CSS 变量动态计算位置 */
  --index: 0;
  --base-offset: 1rem;
  --item-height: 3rem;
  --gap: 0.5rem;
  
  transform: translateY(
    calc(var(--index) * (var(--item-height) + var(--gap)))
  );
}
```

#### 3. **响应式边界检测**
```css
/* 屏幕边界检测 */
@media (max-height: 400px) {
  .minimized-indicators-container {
    flex-direction: row; /* 高度不足时水平排列 */
    bottom: auto;
    top: 1rem;
  }
}

/* 超过最大数量时的堆叠显示 */
.minimized-indicator:nth-child(n+5) {
  opacity: 0.8;
  transform: scale(0.95);
}

.minimized-indicator:nth-child(n+8) {
  opacity: 0.6;
  transform: scale(0.9);
}
```

#### 4. **动画和过渡优化**
```css
/* 进入动画 */
.minimized-indicator-enter {
  animation: slideInUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 退出动画 */
.minimized-indicator-exit {
  animation: slideOutDown 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 重新排列动画 */
.minimized-indicator-reorder {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideOutDown {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(20px);
  }
}
```

### 实现架构

#### 1. **MinimizedIndicatorManager 组件**
```typescript
const MinimizedIndicatorManager = () => {
  const [instances, setInstances] = createSignal<MinimizedInstance[]>([]);
  
  // 添加新实例
  const addInstance = (newInstance: MinimizedInstance) => {
    setInstances(prev => [...prev, newInstance]);
  };
  
  // 移除实例并重新排列
  const removeInstance = (id: string) => {
    setInstances(prev => {
      const filtered = prev.filter(instance => instance.id !== id);
      return filtered.map((instance, index) => ({
        ...instance,
        index // 更新索引用于重新排列
      }));
    });
  };
  
  return (
    <div class="minimized-indicators-container">
      <For each={instances()}>
        {(instance, index) => (
          <MinimizedIndicator
            {...instance}
            index={index()}
            onClose={() => removeInstance(instance.id)}
          />
        )}
      </For>
    </div>
  );
};
```

#### 2. **位置计算 Hook**
```typescript
const useIndicatorPosition = (index: number) => {
  return createMemo(() => {
    const baseOffset = 16; // 1rem
    const itemHeight = 48; // 3rem
    const gap = 8; // 0.5rem
    
    return {
      style: {
        '--index': index,
        '--base-offset': `${baseOffset}px`,
        '--item-height': `${itemHeight}px`,
        '--gap': `${gap}px`
      } as CSSProperties
    };
  });
};
```

### 性能优化

#### 1. **虚拟化列表**
```typescript
// 当实例数量过多时使用虚拟化
const useVirtualizedIndicators = (instances: MinimizedInstance[]) => {
  const maxVisible = 5;
  const [startIndex, setStartIndex] = createSignal(0);
  
  return createMemo(() => {
    const visible = instances.slice(startIndex(), startIndex() + maxVisible);
    const hasMore = instances.length > maxVisible;
    
    return { visible, hasMore, totalCount: instances.length };
  });
};
```

#### 2. **防抖和节流**
```typescript
// 位置重新计算防抖
const debouncedReorder = debounce(() => {
  setInstances(prev => prev.map((instance, index) => ({
    ...instance,
    index
  })));
}, 100);
```

### 可访问性考虑

#### 1. **键盘导航**
```typescript
const handleKeyDown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'ArrowDown':
      // 切换到下一个指示器
      break;
    case 'ArrowUp':
      // 切换到上一个指示器
      break;
    case 'Enter':
    case ' ':
      // 激活当前指示器
      break;
  }
};
```

#### 2. **屏幕阅读器支持**
```html
<div 
  class="minimized-indicator"
  role="button"
  tabindex="0"
  aria-label={`操作: ${title}, 状态: ${status}`}
  aria-describedby={`indicator-${id}-status`}
>
  <span id={`indicator-${id}-status`} class="sr-only">
    {status === 'in-progress' ? '进行中' : 
     status === 'success' ? '已完成' : '已失败'}
  </span>
</div>
```

这个方案符合现代 CSS 最佳实践，提供了流畅的用户体验和良好的性能表现。
