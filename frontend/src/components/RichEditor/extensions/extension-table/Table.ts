import {TableCell, TableKit} from '@tiptap/extension-table'

/**
 * 自定义表格单元格扩展
 * 扩展 TableCell 以支持背景色等自定义属性
 * 基于 Tiptap 官方示例实现
 */
const CustomTableCell = TableCell.extend({
  /**
   * 添加自定义属性
   * 支持单元格背景色等属性
   */
  addAttributes() {
    return {
      // 继承父类的所有属性
      ...this.parent?.(),
      // 添加背景色属性
      backgroundColor: {
        default: null,
        // 从 HTML 元素解析背景色
        parseHTML: element => element.getAttribute('data-background-color') ||
            element.style.backgroundColor || null,
        // 渲染为 HTML 属性
        renderHTML: attributes => {
          if (!attributes.backgroundColor) {
            return {};
          }
          return {
            'data-background-color': attributes.backgroundColor,
            style: `background-color: ${attributes.backgroundColor}`,
          };
        },
      },
    };
  },
});

/**
 * 自定义表格扩展
 * 使用 Tiptap TableKit，包含所有表格相关功能
 * 配置选项：
 * - resizable: 启用表格列大小调整功能
 * - tableCell: 使用自定义的 TableCell 扩展（支持背景色等属性）
 *
 * 包含所有表格相关命令：
 * - insertTable: 插入表格
 * - deleteTable: 删除表格
 * - addRowBefore/addRowAfter: 添加行
 * - deleteRow: 删除行
 * - addColumnBefore/addColumnAfter: 添加列
 * - deleteColumn: 删除列
 * - mergeCells/splitCell: 合并/拆分单元格
 * - toggleHeaderRow/toggleHeaderColumn/toggleHeaderCell: 切换表头
 * - setCellAttribute: 设置单元格属性（如背景色）
 * - fixTables: 修复表格结构
 * - goToNextCell/goToPreviousCell: 单元格导航
 */
export const Table = TableKit.configure({
  // 启用表格列大小调整功能
  table: {
    resizable: true,
  },
  // 禁用默认的 TableCell，使用自定义的 TableCell
  tableCell: false,
});

/**
 * 自定义表格单元格扩展
 * 导出以便在需要时可以单独使用
 */
export {CustomTableCell};

// 确保扩展正确导出
export default Table
