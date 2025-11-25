# Release Notes 1.4.52

## [1.4.52] - 2025-11-25

## [English Version](./RELEASE_NOTES_EN.md)

## 新增功能 / 优化改进

### 界面交互
- **全局一键更新**：添加全局一键更新按钮（`scoop update *`）
- **PackageInfo 界面增强**：
  - 新增更新、更改仓库按钮
  - 无可用更新时，更新按钮支持二次确认进行强制更新
  - 卸载按钮增加二次确认提示

### 功能组件
- **Scoop 配置增强**：
  - 为 Scoop Configuration 组件添加路径验证按钮
  - 更新 Scoop 路径后自动同步内存状态
- **Doctor 页面完善**：
  - 新增 Configuration 组件，显示 Scoop Config 内容
  - 新增 Scoop Commands 组件，支持快捷命令输入
  - 添加类终端显示区域和命令提示
- **操作面板优化**：FloatingOperationPanel 支持最小化行为

## 修复问题 / 其他调整

### 功能修复
- **同步上游**：合并上游 [v1.4.5](https://github.com/AmarBego/Rscoop/releases/tag/v1.4.5) 相关更改
- **组件迁移**：Scoop Proxy 组件从 Settings 页面移至 Doctor 页面

### 界面优化
- **页面重构**：
  - Installed 页面重命名为 Package 页面（代码保持 InstalledPage）
  - 优化 List/Grid 视图排版，修复边缘遮挡问题
- **交互改进**：
  - 使用 FloatingOperationPanel 替换 OperationModal
  - 页面切换改为持久化渲染模式
- **API 扩展**：新增获取 Scoop 配置及执行命令接口

### 样式调整
- 去除默认输入框焦点轮廓
- 改善 List 视图下的软件名显示
- 实验性固定全局及 Package 页面的窗口边距

## 后续计划

### 近期重点
- [ ] 完善窗口最小化行为
- [ ] 解决搜索框内容残留问题
- [ ] 完善 Debug Mode
- [ ] 合并上游 [v1.4.6]更改

### 功能扩展
- [ ] 为更多内容添加操作支持
- [ ] 持续优化（强迫症）用户体验

> 注：代码库内部仍使用 InstalledPage 命名，便于现有代码管理