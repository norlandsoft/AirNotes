import React, {useEffect, useState} from 'react';
import {ColorPicker, Icon} from 'air-design';

import './TableBubbleMenu.less';

/**
 * 获取当前选中的表格元素
 * @param view Tiptap 视图实例
 * @param fromPos 光标位置
 * @returns 当前选中的表格元素或null
 */
const getCurrentSelectedTable = (view: any, fromPos: number): HTMLTableElement | null => {
  // 方法1：通过光标位置查找最近的表格
  const coords = view.coordsAtPos(fromPos);
  const elementAtPos = document.elementFromPoint(coords.left, coords.top);

  if (elementAtPos) {
    // 从光标位置向上查找表格元素
    let currentElement = elementAtPos as HTMLElement;
    while (currentElement && currentElement !== view.dom) {
      if (currentElement.tagName === 'TABLE') {
        return currentElement as HTMLTableElement;
      }
      currentElement = currentElement.parentElement as HTMLElement;
    }
  }

  // 方法2：通过DOM查询所有表格，找到包含光标位置的表格
  const allTables = view.dom.querySelectorAll('table');
  for (const table of allTables) {
    const tableRect = table.getBoundingClientRect();
    if (coords.top >= tableRect.top && coords.top <= tableRect.bottom &&
        coords.left >= tableRect.left && coords.left <= tableRect.right) {
      return table as HTMLTableElement;
    }
  }

  // 方法3：备用方案，返回第一个表格
  return view.dom.querySelector('table');
};

interface TableBubbleMenuProps {
  editor: any;
}

/**
 * 表格气泡菜单组件
 * 在表格单元格选中时显示表格操作工具栏
 */
const TableBubbleMenu: React.FC<TableBubbleMenuProps> = ({editor}) => {
  const [show, setShow] = useState(false);
  const [position, setPosition] = useState({top: 0, left: 0});
  // 当前单元格的背景色，用于颜色选择器的初始值
  const [currentBgColor, setCurrentBgColor] = useState<string | null>(null);
  // 是否可以合并单元格
  const [canMerge, setCanMerge] = useState(false);
  // 是否可以拆分单元格
  const [canSplit, setCanSplit] = useState(false);

  useEffect(() => {
    if (!editor) return;

    const updateMenu = () => {
      if (!editor.isEditable) {
        setShow(false);
        return;
      }

      const isTableActive = editor.isActive('table');

      if (isTableActive) {
        // 获取当前单元格的属性，包括背景色
        try {
          const cellAttributes = editor.getAttributes('tableCell');
          const bgColor = cellAttributes?.backgroundColor || null;
          setCurrentBgColor(bgColor);
        } catch (error) {
          // 如果获取失败，设置为 null
          setCurrentBgColor(null);
        }

        // 检查是否可以合并或拆分单元格
        try {
          // 检查是否可以合并单元格（需要选中多个单元格）
          const canMergeCells = editor.can().mergeCells();
          setCanMerge(canMergeCells);

          // 检查是否可以拆分单元格（当前单元格必须是合并的单元格）
          const canSplitCell = editor.can().splitCell();
          setCanSplit(canSplitCell);
        } catch (error) {
          // 如果检查失败，默认设为 false
          setCanMerge(false);
          setCanSplit(false);
        }

        const {view} = editor;
        const {state} = view;
        const {selection} = state;
        const {from: fromPos} = selection;

        // 获取当前选中的表格元素
        const tableElement = getCurrentSelectedTable(view, fromPos);
        if (tableElement) {
          const tableRect = tableElement.getBoundingClientRect();

          // 获取表格的最后一行
          const lastRow = tableElement.querySelector('tr:last-child');
          let bottomPosition = tableRect.height;

          if (lastRow) {
            const lastRowRect = lastRow.getBoundingClientRect();
            // 计算最后一行底部相对于视口的位置
            bottomPosition = lastRowRect.bottom - tableRect.top;
          }

          // 使用 fixed 定位，相对于视口计算位置
          setPosition({
            top: tableRect.top + bottomPosition + 8, // 最后一行下方 8px
            left: tableRect.left + tableRect.width / 2 // 表格宽度的一半，实现居中
          });
        } else {
          // 备用方案：使用光标位置
          const coords = view.coordsAtPos(fromPos);
          setPosition({
            top: coords.bottom + window.scrollY + 8,
            left: coords.left + window.scrollX
          });
        }
        setShow(true);
      } else {
        setShow(false);
      }
    };

    // 添加滚动事件监听
    const handleScroll = () => {
      if (editor.isActive('table')) {
        updateMenu();
      }
    };

    editor.on('selectionUpdate', updateMenu);
    editor.on('update', updateMenu);
    editor.on('transaction', updateMenu);

    // 监听页面滚动事件
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      editor.off('selectionUpdate', updateMenu);
      editor.off('update', updateMenu);
      editor.off('transaction', updateMenu);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [editor]);

  if (!editor || !show) {
    return null;
  }

  return (
      <div
          className="table-bubble-menu"
          style={{
            position: 'fixed', // 使用 fixed 定位，相对于视口
            top: position.top,
            left: position.left,
            transform: 'translateX(-50%)', // 水平居中
            zIndex: 1000
          }}
      >
        {/* 插入行 */}
        <div
            className="table-toolbar-item"
            title="在上方插入行"
            onClick={() => editor.chain().focus().addRowBefore().run()}
        >
          <Icon name="table_insert_row" size={16}/>
        </div>

        {/* 插入列 */}
        <div
            className="table-toolbar-item"
            title="在左侧插入列"
            onClick={() => editor.chain().focus().addColumnBefore().run()}
        >
          <Icon name="table_insert_column" size={16}/>
        </div>

        <div className="table-toolbar-separator"></div>

        {/* 删除行 */}
        <div
            className="table-toolbar-item"
            title="删除行"
            onClick={() => editor.chain().focus().deleteRow().run()}
        >
          <Icon name="table_delete_row" size={16}/>
        </div>

        {/* 删除列 */}
        <div
            className="table-toolbar-item"
            title="删除列"
            onClick={() => editor.chain().focus().deleteColumn().run()}
        >
          <Icon name="table_delete_column" size={16}/>
        </div>

        <div className="table-toolbar-separator"></div>

        {/* 合并单元格 */}
        <div
            className={`table-toolbar-item ${!canMerge ? 'table-toolbar-item-disabled' : ''}`}
            title={canMerge ? "合并单元格" : "请先选中多个单元格"}
            onClick={() => {
              if (canMerge) {
                editor.chain().focus().mergeCells().run();
              }
            }}
        >
          <Icon name="table_cell_merge" size={16}/>
        </div>

        {/* 拆分单元格 */}
        <div
            className={`table-toolbar-item ${!canSplit ? 'table-toolbar-item-disabled' : ''}`}
            title={canSplit ? "拆分单元格" : "当前单元格未合并，无法拆分"}
            onClick={() => {
              if (canSplit) {
                editor.chain().focus().splitCell().run();
              }
            }}
        >
          <Icon name="table_cell_split" size={16}/>
        </div>

        <div className="table-toolbar-separator"></div>

        {/* 单元格背景颜色 */}
        <ColorPicker
            value={currentBgColor}
            onChangeComplete={(color) => {
              // 设置单元格背景色
              const hexColor = color.toHexString();
              editor.chain().focus().setCellAttribute('backgroundColor', hexColor).run();
            }}
        >
          <div className="table-toolbar-item" title="设置单元格背景颜色">
            <Icon name="table_cell_color" size={18}/>
          </div>
        </ColorPicker>

        <div className="table-toolbar-separator"></div>

        {/* 删除表格 */}
        <div
            className="table-toolbar-item"
            title="删除表格"
            onClick={() => editor.chain().focus().deleteTable().run()}
        >
          <Icon name="delete" size={16}/>
        </div>
      </div>
  );
};

export default TableBubbleMenu;
