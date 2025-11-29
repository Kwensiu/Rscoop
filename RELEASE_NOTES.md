
# Release Notes 1.4.64

## [1.4.64] - 2025-11-29

## **修复 / Fixes**
- **[Fix]** 优化了bucket搜索和缓存逻辑，移除了冗余状态管理
  - 修复了`useBucketSearch`中的定时器类型定义，使用更通用的`ReturnType<typeof setTimeout>`
  - 移除了`useBuckets`中未使用的`isForceRefreshing`状态及相关逻辑
  - 移除了`BucketSearchResults`中未使用的`CircleCheckBig`图标导入
  - 为`usePackageInfo`和`useSearch`添加了`updateSelectedPackage`方法，支持外部选择更新（未有实现）

## **功能 / Features**
- **[Add]** 搜索栏增强：回调了清除按钮
- **[Add]** Scoop配置编辑：新增Scoop配置文件编辑功能，可直接在Doctor页面编辑JSON配置
- **[Add]** 目录快捷访问：为多个组件添加了"打开目录"按钮，方便快速访问相关文件夹

## **改进 / Improvements**
- **[Improvement]** Doctor页面全面重构：
  - 所有组件统一使用Card框架，提升视觉一致性
  - 为Card组件添加了`additionalContent`属性，支持额外内容展示
  - 优化了图标布局和按钮组织，提供更直观的操作体验
  - 移除了未使用的导入和逻辑，简化代码结构

- **[Improvement]** 关于页面优化：
  - 明确标识了这是一个Fork版本，维护者为Kwensiu
  - 更新了版权信息，包含原始作者和Fork维护者
  - 重新组织了链接布局，增加了Fork仓库的直达链接

- **[Improvement]** 设置页面增强：
  - Scoop配置页面添加了刷新和目录打开按钮
  - 代理设置页面使用Card组件重构，改进了UI布局
  - 所有设置组件现在都支持快捷操作和实时状态反馈

---

<details>
<summary>English Version (Click to expand)</summary>

# Release Notes 1.4.63

## **Fixes**
- **[Fix]** Optimized bucket search and caching logic with redundant state removal
  - Fixed timer type definition in `useBucketSearch` using more generic `ReturnType<typeof setTimeout>`
  - Removed unused `isForceRefreshing` state and related logic from `useBuckets`
  - Removed unused `CircleCheckBig` icon import from `BucketSearchResults`
  - Added `updateSelectedPackage` method to `usePackageInfo` and `useSearch` for external selection updates (Hasn't be implemented)

## **Features**
- **[Add]** Search Bar Enhancement: Re-added clear button
- **[Add]** Scoop Configuration Editing: Added functionality to edit Scoop configuration file directly from Doctor page
- **[Add]** Directory Quick Access: Added "Open Directory" buttons to multiple components for easy folder access

## **Improvements**
- **[Improvement]** Doctor Page Comprehensive Refactor:
  - All components now use unified Card framework for improved visual consistency
  - Added `additionalContent` property to Card component for extra content display
  - Optimized icon layout and button organization for more intuitive operation experience
  - Removed unused imports and logic to simplify code structure

- **[Improvement]** About Page Optimization:
  - Clearly identified this as a Fork version maintained by Kwensiu
  - Updated copyright information to include both original author and Fork maintainer
  - Reorganized link layout with direct access to Fork repository

- **[Improvement]** Settings Page Enhancement:
  - Scoop configuration page added refresh and directory open buttons
  - Proxy settings page refactored using Card component with improved UI layout
  - All settings components now support quick actions and real-time status feedback