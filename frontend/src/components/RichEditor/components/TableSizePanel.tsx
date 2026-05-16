import React, {useState} from 'react';

import './TableSizePanel.less';

interface TableSizePanelProps {
  editor: any;
  onClose: () => void;
}

/**
 * 表格尺寸选择面板组件
 * 提供悬停选择表格大小的功能，用于插入表格
 */
const TableSizePanel: React.FC<TableSizePanelProps> = ({editor, onClose}) => {
  // 状态管理：当前悬停的单元格位置
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);

  // 定义表格选择器的最大行列数
  const maxRows = 8;
  const maxCols = 12;

  // 处理表格插入
  const handleInsertTable = (rows: number, cols: number) => {
    if (editor) {
      // 使用 Tiptap 标准的 insertTable 命令
      editor.chain().focus().insertTable({
        rows: rows,
        cols: cols,
        withHeaderRow: true
      }).run();
    }
    onClose();
  };

  return (
      <div className="table-size-panel">
        {/* 渲染表格网格 */}
        <div className="table-grid">
          {Array.from({length: maxRows}, (_, rowIndex) => (
              <div key={rowIndex} className="table-row">
                {Array.from({length: maxCols}, (_, colIndex) => {
                  // 判断当前单元格是否在悬停区域内
                  const isHovered = hoveredCell &&
                      rowIndex <= hoveredCell.row &&
                      colIndex <= hoveredCell.col;

                  return (
                      <div
                          key={`${rowIndex}-${colIndex}`}
                          className={`table-cell ${isHovered ? 'hovered' : ''}`}
                          // 鼠标事件处理：更新悬停状态
                          onMouseEnter={() => setHoveredCell({row: rowIndex, col: colIndex})}
                          onMouseLeave={() => setHoveredCell(null)}
                          // 点击事件处理：选择表格大小并关闭面板
                          onClick={() => {
                            handleInsertTable(rowIndex + 1, colIndex + 1);
                            setHoveredCell(null);
                          }}
                      />
                  );
                })}
              </div>
          ))}
        </div>

        {/* 显示当前选择的表格大小信息 */}
        <div className="table-size-info">
          {hoveredCell ? `${hoveredCell.row + 1} 行 ${hoveredCell.col + 1} 列` : '选择表格大小'}
        </div>
      </div>
  );
};

export default TableSizePanel;
