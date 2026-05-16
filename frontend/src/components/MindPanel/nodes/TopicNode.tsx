import React, {useEffect, useRef, useState} from 'react';
import {Handle, NodeProps, Position} from '@xyflow/react';
import TextareaAutosize from 'react-textarea-autosize';
import './TopicNode.less';

interface TopicNodeData extends Record<string, unknown> {
  value: string;
  level: number;
  documentId: string;
  parentId: string;
  levelMaxWidth?: number;
  color?: string;
  isBeingDragged?: boolean; // 是否正在被拖动（包括其父节点被拖动）
  childCount?: number; // 直接子节点数量（用于展示）
  collapsed?: boolean; // 是否折叠：折叠后隐藏所有子节点及其后续节点
}

interface TopicNodeProps extends NodeProps {
  data: TopicNodeData;
}

const minWidth = 60;
const maxWidth = 300;

/**
 * 思维导图主题节点组件
 */
const TopicNode: React.FC<TopicNodeProps> = ({data, selected, id}) => {

  const hiddenTextRef = useRef<HTMLDivElement>(null);

  const [editable, setEditable] = useState(false);
  const [value, setValue] = useState(data.value);
  const [width, setWidth] = useState<number>(Math.max(minWidth, Math.min(maxWidth, (data.levelMaxWidth as number) || minWidth)));
  const childCount = typeof data.childCount === 'number' ? data.childCount : 0;
  const isCollapsed = !!data.collapsed;
  const hasChildren = childCount > 0;

  const getLevelStyle = () => {
    // 正常样式
    switch (data?.level) {
      case 0:
        return {
          backgroundColor: '#222',
          // left: -16,
          color: '#fff',
          fontSize: '1.2rem',
          fontWeight: 600,
          padding: '16px',
          lineHeight: '20px',
          border: selected ? '1px solid #1890ff' : '1px solid #fff',
          borderRadius: '8px',
        };
      case 1:
        return {
          backgroundColor: (data as any)?.color || '#ff6b6b',
          // left: -8,
          color: '#222',
          fontSize: '0.95rem',
          fontWeight: 500,
          padding: '8px',
          lineHeight: '20px',
          border: selected ? '1px solid #1890ff' : `1px solid ${((data as any)?.color || '#ff6b6b')}`,
        };
      default:
        return {
          backgroundColor: (data as any)?.color || '#dbe6f1',
          // left: -8,
          color: '#222',
          fontSize: '13px',
          fontWeight: 500,
          padding: '4px 8px',
          lineHeight: '18px',
          border: selected ? '1px solid #1890ff' : '1px solid transparent',
        };
    }
  }

  /**
   * 统一的内容更新处理函数
   * 退出编辑模式并触发内容更新事件（如果内容有变化）
   */
  const handleContentUpdate = () => {
    setEditable(false);
    // 通知画布可以恢复拖动
    window.dispatchEvent(new CustomEvent('nodeEditStateChange', {
      detail: {nodeId: id, isEditing: false}
    }));
    // 发送内容改变事件（如果内容确实改变了）
    if (value !== data.value) {
      window.dispatchEvent(new CustomEvent('updateNodeContent', {
        detail: {nodeId: id, content: value}
      }));
    }
  };

  // 处理失去焦点事件，退出编辑模式并更新内容
  const handleBlur = () => {
    handleContentUpdate();
    // 通知画布可以恢复拖动
    window.dispatchEvent(new CustomEvent('nodeEditStateChange', {
      detail: {nodeId: id, isEditing: false}
    }));
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Tab') {
      event.preventDefault();
      if (editable) {
        handleContentUpdate();
      } else {
        window.dispatchEvent(new CustomEvent('addChildNode', {
          detail: {parentId: id, level: data.level + 1, nodeType: 'topic', parentType: 'topic'}
        }));
      }
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      if (!editable) {
        event.preventDefault();
        // 检查是否为根节点，根节点不可删除
        if (id === 'mind-root') {
          return;
        }
        window.dispatchEvent(new CustomEvent('deleteNode', {
          detail: {nodeId: id}
        }));
      }
    }

    if (event.key === 'Escape') {
      // ESC 键取消编辑，不更新内容
      setEditable(false);
      setValue(data.value); // 恢复原始内容
      // 通知画布可以恢复拖动
      window.dispatchEvent(new CustomEvent('nodeEditStateChange', {
        detail: {nodeId: id, isEditing: false}
      }));
    }

    // Enter键退出编辑模式并更新内容（Shift+Enter 用于换行，不退出）
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // 阻止默认换行行为
      handleContentUpdate();
    }
  };

  const handleDoubleClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setEditable(true);
    // 通知画布禁用拖动
    window.dispatchEvent(new CustomEvent('nodeEditStateChange', {
      detail: {nodeId: id, isEditing: true}
    }));
    setTimeout(() => {
      // 获取所有class为'air-resizable-textarea'的元素（理论上只有一个）
      const textAreas = document.getElementsByClassName('air-resizable-textarea');
      if (textAreas && textAreas.length > 0) {
        const ta = textAreas[0] as HTMLTextAreaElement;
        // 将光标移动到内容最后
        const len = ta.value.length;
        ta.setSelectionRange(len, len);
        ta.focus();
      }
    }, 0);
  }

  const handleMouseEvent = (event: React.MouseEvent) => {
    // event.stopPropagation();
  }

  // 节点容器引用，用于事件处理
  const nodeContainerRef = useRef<HTMLDivElement>(null);
  const contentDivRef = useRef<HTMLDivElement>(null);

  // 拖动状态
  const isDraggingRef = useRef(false);
  const dragStartPosRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const dragOverlayRef = useRef<HTMLDivElement | null>(null);

  // level1 及以下级别的节点（level >= 1，排除根节点）：实现拖动功能
  useEffect(() => {
    // 只处理 level >= 1 的节点（排除根节点 level 0）
    if (data.level === 0) return;

    // 如果节点处于可编辑状态，不绑定拖动事件监听器，让textarea正常响应鼠标操作
    if (editable) return;

    const nodeContainer = nodeContainerRef.current;
    if (!nodeContainer) return;

    // 创建拖动覆盖层（跟随鼠标的拖动物体）
    const createDragOverlay = (): HTMLDivElement => {
      const overlay = document.createElement('div');
      overlay.style.position = 'fixed';
      overlay.style.zIndex = '9999';
      overlay.style.pointerEvents = 'none';
      overlay.style.userSelect = 'none';
      overlay.style.cursor = 'grabbing';

      // 复制节点内容div的样式和内容
      const contentDiv = contentDivRef.current;
      if (contentDiv) {
        const computedStyle = window.getComputedStyle(contentDiv);
        overlay.style.width = computedStyle.width;
        overlay.style.minWidth = computedStyle.minWidth;
        overlay.style.maxWidth = computedStyle.maxWidth;
        overlay.style.backgroundColor = computedStyle.backgroundColor;
        overlay.style.color = computedStyle.color;
        overlay.style.fontSize = computedStyle.fontSize;
        overlay.style.fontWeight = computedStyle.fontWeight;
        overlay.style.padding = computedStyle.padding;
        overlay.style.lineHeight = computedStyle.lineHeight;
        overlay.style.border = computedStyle.border;
        overlay.style.borderRadius = computedStyle.borderRadius;
        overlay.style.textAlign = computedStyle.textAlign;
        overlay.textContent = value;

        // 添加视觉效果
        overlay.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.25), 0 4px 12px rgba(0, 0, 0, 0.15)';
        overlay.style.opacity = '0.5'; // 拖动覆盖层设置为半透明
        overlay.style.transform = 'rotate(2deg) scale(1.05)';
      }

      document.body.appendChild(overlay);
      return overlay;
    };

    // 鼠标按下事件处理
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // 点击折叠/展开控件时，不触发拖动逻辑
      if (target?.closest?.('.air-mind-topic-node-collapse-toggle')) {
        e.stopPropagation();
        e.preventDefault();
        return;
      }

      // 如果节点处于可编辑状态，或者点击的是textarea，阻止事件传递到node和flow层
      if (editable || target.tagName === 'TEXTAREA' || target.closest('textarea')) {
        // 阻止事件传播到node和flow层，但允许textarea正常处理
        e.stopPropagation();
        e.preventDefault();
        return;
      }

      // 阻止事件传递到 ReactFlow
      e.stopPropagation();

      // 获取内容div的位置，计算鼠标相对于节点的偏移
      const contentDiv = contentDivRef.current;
      if (!contentDiv) return;

      const contentRect = contentDiv.getBoundingClientRect();
      const offsetX = e.clientX - contentRect.left;
      const offsetY = e.clientY - contentRect.top;

      // 记录拖动起始位置和偏移
      dragStartPosRef.current = {
        x: e.clientX,
        y: e.clientY,
        offsetX: offsetX,
        offsetY: offsetY
      };
      isDraggingRef.current = false;

      // 全局鼠标移动事件处理
      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!dragStartPosRef.current) return;

        // 如果节点变为可编辑状态，清理拖动状态
        if (editable) {
          dragStartPosRef.current = null;
          isDraggingRef.current = false;
          if (dragOverlayRef.current) {
            try {
              document.body.removeChild(dragOverlayRef.current);
            } catch (e) {
              // 覆盖层可能已经被移除
            }
            dragOverlayRef.current = null;
          }
          document.removeEventListener('mousemove', handleMouseMove, true);
          document.removeEventListener('mouseup', handleMouseUp, true);
          return;
        }

        // 计算移动距离
        const deltaX = Math.abs(moveEvent.clientX - dragStartPosRef.current.x);
        const deltaY = Math.abs(moveEvent.clientY - dragStartPosRef.current.y);
        const dragThreshold = 3;

        // 如果移动距离超过阈值，开始拖动
        if ((deltaX > dragThreshold || deltaY > dragThreshold) && !isDraggingRef.current) {
          isDraggingRef.current = true;

          // 触发拖动开始事件，通知index.tsx设置被拖动节点及其子节点的半透明效果
          window.dispatchEvent(new CustomEvent('dragNodeStart', {
            detail: {nodeId: id}
          }));

          // 创建拖动覆盖层
          dragOverlayRef.current = createDragOverlay();

          // 设置初始位置
          if (dragOverlayRef.current) {
            const initialX = moveEvent.clientX - dragStartPosRef.current.offsetX;
            const initialY = moveEvent.clientY - dragStartPosRef.current.offsetY;
            dragOverlayRef.current.style.left = `${initialX}px`;
            dragOverlayRef.current.style.top = `${initialY}px`;
          }

          moveEvent.stopPropagation();
          moveEvent.preventDefault();
        }

        // 如果正在拖动，更新覆盖层位置并检测目标节点
        if (isDraggingRef.current && dragOverlayRef.current && dragStartPosRef.current) {
          moveEvent.stopPropagation();
          moveEvent.preventDefault();

          // 更新拖动覆盖层位置（跟随鼠标光标）
          const x = moveEvent.clientX - dragStartPosRef.current.offsetX;
          const y = moveEvent.clientY - dragStartPosRef.current.offsetY;
          dragOverlayRef.current.style.left = `${x}px`;
          dragOverlayRef.current.style.top = `${y}px`;

          // 检测当前鼠标下的放置目标节点
          // 临时隐藏拖动覆盖层，避免检测到覆盖层本身
          dragOverlayRef.current.style.pointerEvents = 'none';
          const elementBelow = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY);

          // 如果检测到的是拖动覆盖层，忽略
          if (elementBelow === dragOverlayRef.current || dragOverlayRef.current.contains(elementBelow)) {
            dragOverlayRef.current.style.pointerEvents = 'none';
            return;
          }
        }
      };

      // 全局鼠标抬起事件处理
      const handleMouseUp = (upEvent: MouseEvent) => {
        // 清理
        document.removeEventListener('mousemove', handleMouseMove, true);
        document.removeEventListener('mouseup', handleMouseUp, true);

        // 如果确实发生了拖动，检测目标节点
        if (isDraggingRef.current && dragStartPosRef.current) {
          upEvent.stopPropagation();
          upEvent.preventDefault();

          // 检测鼠标下的元素
          const elementBelow = document.elementFromPoint(upEvent.clientX, upEvent.clientY);
          const targetNode = elementBelow?.closest('.air-mind-topic-node') as HTMLElement | null;
          const targetNodeId = targetNode?.getAttribute('data-node-id') || null;

          // 触发拖动结束事件，所有判断逻辑在 handleDragNodeEnd 中基于 mapDataRef.current 进行
          // TopicNode 不进行任何业务逻辑判断，只要有目标节点就触发事件
          if (targetNodeId) {
            window.dispatchEvent(new CustomEvent('dragNodeEnd', {
              detail: {nodeId: id, targetNodeId: targetNodeId}
            }));
          } else {
            // 如果没有目标节点，也需要清除半透明效果
            window.dispatchEvent(new CustomEvent('dragNodeEnd', {
              detail: {nodeId: id, targetNodeId: null}
            }));
          }
        }

        // 清理拖动覆盖层
        if (dragOverlayRef.current) {
          try {
            document.body.removeChild(dragOverlayRef.current);
          } catch (e) {
            // 覆盖层可能已经被移除
          }
          dragOverlayRef.current = null;
        }

        // 重置状态
        isDraggingRef.current = false;
        dragStartPosRef.current = null;
      };

      // 绑定全局事件监听器
      document.addEventListener('mousemove', handleMouseMove, true);
      document.addEventListener('mouseup', handleMouseUp, true);
    };

    // 绑定鼠标按下事件
    nodeContainer.addEventListener('mousedown', handleMouseDown, true);

    // 清理函数
    return () => {
      nodeContainer.removeEventListener('mousedown', handleMouseDown, true);

      // 清理拖动覆盖层（如果存在）
      if (dragOverlayRef.current) {
        try {
          document.body.removeChild(dragOverlayRef.current);
        } catch (e) {
          // 覆盖层可能已经被移除
        }
        dragOverlayRef.current = null;
      }

      // 重置状态
      isDraggingRef.current = false;
      dragStartPosRef.current = null;
    };
  }, [data.level, id, editable]);

  // 当层级最大宽度变化时，统一设置渲染宽度，保持同层一致
  useEffect(() => {
    const target = Math.max(minWidth, Math.min(maxWidth, (data.levelMaxWidth as number) || minWidth));
    setWidth(target);
  }, [data.levelMaxWidth]);

  return (
      <div
          ref={nodeContainerRef}
          className='air-mind-topic-node'
          data-node-id={id}
          style={{
            width: `${width}px`,
            opacity: (data as any)?.isBeingDragged ? 0.5 : 1, // 被拖动节点及其子节点半透明
            transition: (data as any)?.isBeingDragged ? undefined : 'opacity 0.2s',
          }}
          onKeyDown={handleKeyDown}
          onDoubleClickCapture={handleDoubleClick}
          onMouseMove={handleMouseEvent}
          onClick={handleMouseEvent}
          tabIndex={-1}
      >
        <div className='air-mind-topic-node-content'>
          {/* 隐藏的文本元素用于计算宽度 */}
          <div
              ref={hiddenTextRef}
              style={{
                ...getLevelStyle(),
                position: 'absolute',
                visibility: 'hidden',
                fontFamily: 'inherit',
                whiteSpace: 'nowrap',
                margin: '0',
                outline: 'none',
                boxSizing: 'border-box', // 统一使用 border-box，确保宽度计算包含 padding 和 border
              }}
          />

          {
            editable ? (
                <TextareaAutosize
                    value={value}
                    className={'air-resizable-textarea'}
                    style={{
                      ...getLevelStyle(),
                      width: `${width}px`,
                      minWidth: `${minWidth}px`,
                      maxWidth: `${maxWidth}px`,
                      boxSizing: 'border-box', // 统一使用 border-box，确保宽度计算包含 padding 和 border
                      letterSpacing: 'normal', // 确保字符间距一致，特别是中英文混排场景
                      textRendering: 'auto', // 确保文本渲染方式一致
                    }}
                    onChange={e => {
                      setValue(e.target.value);
                    }}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                />
            ) : (
                <div
                    ref={contentDivRef}
                    className={'air-resizable-textarea-view'}
                    style={{
                      ...getLevelStyle(),
                      width: `${width}px`,
                      minWidth: `${minWidth}px`,
                      maxWidth: `${maxWidth}px`,
                      textAlign: data.level == 0 ? 'center' : 'left',
                      cursor: data.level >= 1 ? 'move' : 'default',
                      userSelect: 'none', // 拖动时禁止文本选择
                      pointerEvents: 'auto', // 确保鼠标事件能被捕获
                      boxSizing: 'border-box', // 统一使用 border-box，确保宽度计算包含 padding 和 border
                      whiteSpace: 'normal', // 允许文本正常换行
                      wordBreak: 'break-word', // 修复中文文本换行问题：优先在词语边界换行
                      overflowWrap: 'break-word', // 必要时在字符边界换行，防止溢出
                      letterSpacing: 'normal', // 确保字符间距一致，特别是中英文混排场景
                      textRendering: 'auto', // 确保文本渲染方式一致
                    }}
                >
                  {value}
                </div>
            )
          }

        </div>

        {/* 右侧折叠/展开控件：模仿 xmind 交互
          - 有子节点且未折叠：显示折叠小图标（点击后折叠，隐藏所有后代）
          - 折叠后：显示子节点数量（点击数量展开） */}
        {hasChildren && !isCollapsed && (
            <div
                className='air-mind-topic-node-collapse-toggle is-icon'
                title='折叠'
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  window.dispatchEvent(new CustomEvent('toggleNodeCollapse', {
                    detail: {nodeId: id, collapsed: true}
                  }));
                }}
            >
              -
            </div>
        )}

        {hasChildren && isCollapsed && (
            <div
                className='air-mind-topic-node-collapse-toggle'
                title='展开'
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  window.dispatchEvent(new CustomEvent('toggleNodeCollapse', {
                    detail: {nodeId: id, collapsed: false}
                  }));
                }}
            >
              {childCount}
            </div>
        )}

        {/* 新增：为Handle添加top: '50%' 以确保连接点垂直居中，无论padding或高度，修复单行连线弯折 */}
        <Handle
            type='target'
            position={Position.Left}
            id='left'
            className='air-mind-topic-node-handler'
            style={{left: 0, top: '50%'}}
        />
        <Handle
            type='source'
            position={Position.Right}
            id='right'
            className='air-mind-topic-node-handler'
            style={{right: 0, top: '50%'}}
        />
      </div>
  );
};

export default TopicNode;
