# 表格扩展

基于 Tiptap TableKit 实现的表格功能，提供完整的表格编辑能力。参考 Tiptap 官方示例实现。

## 功能特性

### 表格基础功能

- 插入表格
- 删除表格
- 表格样式自定义
- **列大小调整（resizable）**：支持拖拽调整列宽

### 表格行操作

- 添加行（前/后）
- 删除行
- 切换表头行

### 表格列操作

- 添加列（前/后）
- 删除列
- 切换表头列

### 单元格功能

- **单元格背景色设置**：支持自定义背景色
- 文字颜色设置
- 文字对齐（左/中/右）
- 垂直对齐（上/中/下）
- 单元格合并（跨行/跨列）
- 单元格拆分
- 切换表头单元格

### 高级功能

- 修复表格结构
- 单元格导航（前进/后退）
- 支持 `colgroup` 和 `rowspan`

## 实现方式

使用 Tiptap 官方的 TableKit 扩展，并进行了以下配置：

1. **启用列大小调整**：`table: { resizable: true }`
2. **自定义 TableCell**：扩展 TableCell 以支持背景色等自定义属性

## 使用方法

```typescript
import { TableExtensions } from './extensions/extension-table'

// 在编辑器配置中使用
// TableExtensions 是一个数组，需要展开
const extensions = [
  // ... 其他扩展
  ...TableExtensions, // 展开使用 TableKit + 自定义 TableCell
]
```

## 样式特性

- 微信文档风格样式
- 响应式设计
- 悬停效果
- 选中状态

## 命令 API

### 表格命令

- `insertTable({ rows, cols, withHeaderRow })` - 插入表格
- `deleteTable()` - 删除表格
- `fixTables()` - 修复表格结构

### 行命令

- `addRowBefore()` - 在前面添加行
- `addRowAfter()` - 在后面添加行
- `deleteRow()` - 删除行
- `toggleHeaderRow()` - 切换表头行

### 列命令

- `addColumnBefore()` - 在前面添加列
- `addColumnAfter()` - 在后面添加列
- `deleteColumn()` - 删除列
- `toggleHeaderColumn()` - 切换表头列

### 单元格命令

- `mergeCells()` - 合并单元格
- `splitCell()` - 拆分单元格
- `mergeOrSplit()` - 合并或拆分单元格
- `toggleHeaderCell()` - 切换表头单元格
- `setCellAttribute(name, value)` - 设置单元格属性（如背景色）
  ```typescript
  // 示例：设置单元格背景色
  editor.chain().focus().setCellAttribute('backgroundColor', '#FAF594').run()
  ```
- `goToNextCell()` - 跳转到下一个单元格
- `goToPreviousCell()` - 跳转到上一个单元格

## 自定义属性

### 单元格背景色

自定义 TableCell 扩展支持 `backgroundColor` 属性：

```typescript
// 设置单元格背景色
editor.chain().focus().setCellAttribute('backgroundColor', '#FAF594').run()

// 移除背景色
editor.chain().focus().setCellAttribute('backgroundColor', null).run()
```

背景色会以两种方式存储：

- `data-background-color` 属性
- `style` 属性中的 `background-color`

## 注意事项

1. 使用 Tiptap TableKit 提供完整的表格功能
2. 样式文件需要正确导入（`table.less`）
3. 建议配合 TableBubbleMenu 组件使用以获得更好的用户体验
4. `TableExtensions` 是一个数组，使用时需要使用展开运算符 `...TableExtensions`
5. 列大小调整功能需要表格处于可编辑状态
