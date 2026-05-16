import React, {useEffect, useState} from 'react';
import {Form, Select} from 'antd';

import './CodeBlockBubbleMenu.less';

/**
 * 支持的编程语言列表
 */
const codeLanguages = [
  {label: 'Plain Text', value: 'plaintext'},
  {label: 'JavaScript', value: 'javascript'},
  {label: 'TypeScript', value: 'typescript'},
  {label: 'Python', value: 'python'},
  {label: 'HTML', value: 'html'},
  {label: 'CSS', value: 'css'},
  {label: 'Java', value: 'java'},
  {label: 'C++', value: 'cpp'},
  {label: 'Shell', value: 'bash'},
];

interface CodeBlockBubbleMenuProps {
  editor: any;
}

/**
 * 代码块气泡菜单组件
 * 在代码块获得焦点时显示语言选择器
 */
const CodeBlockBubbleMenu: React.FC<CodeBlockBubbleMenuProps> = ({editor}) => {
  const [show, setShow] = useState(false);
  const [position, setPosition] = useState({top: 0, left: 0});
  // 当前代码块的语言
  const [currentLanguage, setCurrentLanguage] = useState<string>('plaintext');

  useEffect(() => {
    if (!editor) return;

    const updateMenu = () => {
      // 只在可编辑状态下显示
      if (!editor.isEditable) {
        setShow(false);
        return;
      }

      // 检查是否在代码块中
      const isCodeBlockActive = editor.isActive('codeBlock');

      if (isCodeBlockActive) {
        // 获取当前代码块的语言
        try {
          const codeBlockAttributes = editor.getAttributes('codeBlock');
          const language = codeBlockAttributes?.language || 'plaintext';
          setCurrentLanguage(language);
        } catch (error) {
          // 如果获取失败，使用默认值
          setCurrentLanguage('plaintext');
        }

        const {view} = editor;
        const {state} = view;
        const {selection} = state;
        const {from: fromPos} = selection;

        // 获取代码块元素的位置
        try {
          // 获取当前选中的代码块节点
          let codeBlockPos: number | null = null;

          // 查找包含选择位置的代码块节点
          state.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
            if (node.type.name === 'codeBlock') {
              codeBlockPos = pos;
            }
          });

          if (codeBlockPos !== null) {
            // 获取代码块在 DOM 中的位置
            const codeBlockDOM = view.nodeDOM(codeBlockPos);

            if (codeBlockDOM && codeBlockDOM instanceof HTMLElement) {
              const codeBlockRect = codeBlockDOM.getBoundingClientRect();

              // 在代码块上方显示 bubble menu
              setPosition({
                top: codeBlockRect.top + window.scrollY - 50, // 代码块上方 8px
                left: codeBlockRect.left + codeBlockRect.width / 2, // 代码块宽度的一半，实现居中
              });
            } else {
              // 备用方案：使用光标位置
              const coords = view.coordsAtPos(fromPos);
              setPosition({
                top: coords.top + window.scrollY - 40,
                left: coords.left + window.scrollX,
              });
            }
          } else {
            // 备用方案：使用光标位置
            const coords = view.coordsAtPos(fromPos);
            setPosition({
              top: coords.top + window.scrollY - 40,
              left: coords.left + window.scrollX,
            });
          }
        } catch (error) {
          // 如果获取位置失败，使用光标位置
          const coords = view.coordsAtPos(fromPos);
          setPosition({
            top: coords.top + window.scrollY - 40,
            left: coords.left + window.scrollX,
          });
        }

        setShow(true);
      } else {
        setShow(false);
      }
    };

    // 添加滚动事件监听
    const handleScroll = () => {
      if (editor.isActive('codeBlock')) {
        updateMenu();
      }
    };

    // 监听编辑器事件
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

  /**
   * 处理语言变化
   * @param value 选中的语言值
   */
  const handleLanguageChange = (value: string) => {
    if (!editor) {
      return;
    }

    // 更新代码块的语言属性
    editor
        .chain()
        .focus()
        .updateAttributes('codeBlock', {language: value})
        .run();

    setCurrentLanguage(value);
  };

  if (!editor || !show) {
    return null;
  }

  return (
      <div
          className="code-block-bubble-menu"
          style={{
            position: 'fixed',
            top: position.top,
            left: position.left,
            transform: 'translateX(-50%)', // 水平居中
            zIndex: 1000,
          }}
      >
        <div className="code-block-bubble-menu-content">
          <Form>
            <Form.Item style={{margin: '4px'}}>
              <Select
                  value={currentLanguage}
                  size="small"
                  style={{width: 160}}
                  onChange={handleLanguageChange}
                  options={codeLanguages}
                  popupMatchSelectWidth={false}
                  getPopupContainer={(triggerNode) => triggerNode.parentElement || document.body}
              />
            </Form.Item>
          </Form>
        </div>
      </div>
  );
};

export default CodeBlockBubbleMenu;

