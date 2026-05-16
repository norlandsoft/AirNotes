/**
 * 自定义表格扩展集合
 * 基于 Tiptap 官方示例实现，提供完整的表格功能
 */

import {CustomTableCell, Table} from './Table'

/**
 * 自定义表格扩展集合
 * 使用 Tiptap TableKit，包含所有表格相关功能
 *
 * 导出格式：TableKit 配置 + 自定义 TableCell
 * 这样可以在保持 TableKit 所有功能的同时，添加自定义的单元格属性支持
 */
export const TableExtensions = [Table, CustomTableCell]
