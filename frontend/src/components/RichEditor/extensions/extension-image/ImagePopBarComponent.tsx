import React, {useEffect, useRef, useState} from 'react';
import {Editor, isNodeSelection} from '@tiptap/core';
import {ImagePopBar} from './ImagePopBar';
import './ImagePopBar.css';

// 图标组件
const AlignLeftIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="2" y1="3" x2="22" y2="3" strokeWidth="1.5"/>
      <rect x="3" y="8.5" width="9" height="9" rx="2"/>
      <line x1="2" y1="23" x2="22" y2="23" strokeWidth="1.5"/>
      <line x1="15" y1="10" x2="22" y2="10" strokeWidth="1.5"/>
      <line x1="15" y1="16" x2="22" y2="16" strokeWidth="1.5"/>
    </svg>
);

const AlignCenterIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="2" y1="3" x2="22" y2="3" strokeWidth="1.5"/>
      <rect x="7.5" y="8.5" width="9" height="9" rx="2"/>
      <line x1="2" y1="23" x2="22" y2="23" strokeWidth="1.5"/>
    </svg>
);

const AlignRightIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="2" y1="3" x2="22" y2="3" strokeWidth="1.5"/>
      <rect x="12" y="8.5" width="9" height="9" rx="2"/>
      <line x1="2" y1="23" x2="22" y2="23" strokeWidth="1.5"/>
      <line x1="2" y1="10" x2="8" y2="10" strokeWidth="1.5"/>
      <line x1="2" y1="16" x2="8" y2="16" strokeWidth="1.5"/>
    </svg>
);

// 无包裹的左对齐图标
const AlignLeftNoWrapIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="2" y1="3" x2="22" y2="3" strokeWidth="1.5"/>
      <rect x="3" y="8.5" width="9" height="9" rx="2"/>
      <line x1="2" y1="23" x2="22" y2="23" strokeWidth="1.5"/>
    </svg>
);

// 无包裹的右对齐图标
const AlignRightNoWrapIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="2" y1="3" x2="22" y2="3" strokeWidth="1.5"/>
      <rect x="12" y="8.5" width="9" height="9" rx="2"/>
      <line x1="2" y1="23" x2="22" y2="23" strokeWidth="1.5"/>
    </svg>
);

const DeleteIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18M8 6V4c0-.5.5-1 1-1h6c.5 0 1 .5 1 1v2M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M10 11v6M14 11v6"/>
    </svg>
);

interface ImagePopBarComponentProps {
  editor: Editor;
}

const ImagePopBarComponent: React.FC<ImagePopBarComponentProps> = ({editor}) => {
  // 使用ref保存DOM元素和工具栏实例
  const containerRef = useRef<HTMLDivElement>(null);
  const popBarRef = useRef<ImagePopBar | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 组件加载时初始化工具栏
  useEffect(() => {
    if (!containerRef.current || !editor) {
      return;
    }

    // 清理之前的实例
    if (popBarRef.current) {
      try {
        popBarRef.current.destroy();
      } catch (error) {
        // 错误处理
      }
      popBarRef.current = null;
    }

    // 防止快速切换导致的重复初始化
    setIsInitialized(false);
    setError(null);

    try {
      // 确保样式可见
      if (containerRef.current) {
        containerRef.current.style.visibility = 'visible';
        containerRef.current.style.position = 'static';
        containerRef.current.style.zIndex = '9999';
      }

      // 创建弹出工具栏实例
      popBarRef.current = new ImagePopBar({
        editor,
        element: containerRef.current,
        tippyOptions: {
          theme: 'image-pop-bar',
          offset: [0, 8],
          zIndex: 30,
        },
      });

      setIsInitialized(true);

      // 添加原生DOM事件监听来测试点击事件
      const addNativeClickListeners = () => {
        if (!containerRef.current) return;

        // 获取所有按钮元素
        const buttons = containerRef.current.querySelectorAll('.image-pop-bar-item');

        // 为每个按钮添加原生点击事件
        buttons.forEach((button, index) => {
          const buttonElement = button as HTMLElement;

          // 移除已有的事件监听器（如果有）
          buttonElement.removeEventListener('click', nativeClickHandler);

          // 添加新的事件监听器
          buttonElement.addEventListener('click', nativeClickHandler);

          // 添加鼠标按下事件监听器
          buttonElement.removeEventListener('mousedown', nativeMouseDownHandler);
          buttonElement.addEventListener('mousedown', nativeMouseDownHandler);
        });
      };

      // 原生点击事件处理函数
      const nativeClickHandler = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();

        // 根据按钮类型执行相应操作
        const target = e.target as HTMLElement;
        const button = target.closest('.image-pop-bar-item') as HTMLElement;

        if (!button) return;

        const testId = button.getAttribute('data-testid');

        // 根据按钮类型调用对应的处理函数
        switch (testId) {
          case 'align-left-btn':
            buttonClickHandler('left');
            break;
          case 'align-center-btn':
            buttonClickHandler('center');
            break;
          case 'align-right-btn':
            buttonClickHandler('right');
            break;
          case 'align-left-nowrap-btn':
            buttonClickHandler('left-nowrap');
            break;
          case 'align-right-nowrap-btn':
            buttonClickHandler('right-nowrap');
            break;
          case 'delete-btn':
            buttonClickHandler('delete');
            break;
        }
      };

      // 原生鼠标按下事件处理函数
      const nativeMouseDownHandler = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
      };

      // 按钮点击处理函数
      const buttonClickHandler = (type: 'left' | 'center' | 'right' | 'left-nowrap' | 'right-nowrap' | 'delete') => {
        try {
          const {selection} = editor.state;
          if (!isNodeSelection(selection) || selection.node.type.name !== 'image') {
            return;
          }

          const {from} = selection;

          // 公共函数：应用对齐样式
          const applyAlignStyle = (align: 'left' | 'center' | 'right' | 'left-nowrap' | 'right-nowrap', styleStr: string) => {
            const attrs = {
              style: styleStr,
              align: align,
              class: `image-align-${align}`,
              'data-align': align // 添加data属性以确保持久化
            };

            // 通过编辑器命令更新节点属性
            editor.chain().focus().command(({tr}) => {
              tr.setNodeMarkup(from, undefined, {...selection.node.attrs, ...attrs});
              return true;
            }).run();

            // 同时直接修改DOM以确保样式立即生效
            try {
              const imageElement = editor.view.nodeDOM(from);
              if (imageElement) {
                const imgElement = imageElement as HTMLElement;
                const container = imgElement.closest('.image-container') || imgElement.parentElement;
                if (container) {
                  // 移除所有对齐类
                  container.classList.remove('image-align-left', 'image-align-center', 'image-align-right', 'image-align-left-nowrap', 'image-align-right-nowrap');
                  // 添加新的对齐类
                  container.classList.add(`image-align-${align}`);
                  // 设置内联样式
                  container.setAttribute('style', styleStr);
                  // 设置对齐属性和数据属性
                  container.setAttribute('align', align);
                  container.setAttribute('data-align', align);

                  // 如果是图片容器内的img元素，也设置属性
                  const img = container.querySelector('img');
                  if (img) {
                    img.setAttribute('align', align);
                    img.setAttribute('data-align', align);
                  }
                }
              }
            } catch (e) {
              console.log(`应用${align}对齐样式时出错:`, e);
            }
          };

          switch (type) {
            case 'left':
              const leftStyleStr = 'float: left; margin-right: 10px; margin-left: 0; clear: left;';
              applyAlignStyle('left', leftStyleStr);
              break;
            case 'center':
              const centerStyleStr = 'display: block; margin-left: auto !important; margin-right: auto !important; float: none !important; clear: both !important; text-align: center !important; width: fit-content !important;';
              applyAlignStyle('center', centerStyleStr);

              // 额外修复：强制应用居中样式
              try {
                const imageElement = editor.view.nodeDOM(from);
                if (imageElement) {
                  const imgElement = imageElement as HTMLElement;
                  const container = imgElement.closest('.image-container') || imgElement.parentElement;
                  if (container) {
                    // 先清除所有浮动和对齐样式
                    const containerEl = container as HTMLElement;
                    containerEl.style.float = 'none';
                    containerEl.style.display = 'block';
                    containerEl.style.marginLeft = 'auto';
                    containerEl.style.marginRight = 'auto';
                    containerEl.style.textAlign = 'center';
                    containerEl.style.clear = 'both';
                    containerEl.style.width = 'fit-content'; // 限制宽度为内容宽度

                    // 强制修改父元素样式为text-align: center
                    const parent = containerEl.parentElement;
                    if (parent) {
                      // 不再设置父元素的text-align样式
                      // parent.style.textAlign = 'center';

                      // 仍然添加标记，但只用于删除图片时识别
                      parent.dataset.imgCentered = 'true';
                    }
                  }
                }
              } catch (e) {
                console.log('强制应用居中样式时出错:', e);
              }
              break;
            case 'right':
              const rightStyleStr = 'float: right; margin-left: 10px; margin-right: 0; clear: right;';
              applyAlignStyle('right', rightStyleStr);
              break;
            case 'left-nowrap':
              const leftNoWrapStyleStr = 'display: block; float: none; margin-right: auto; margin-left: 0; clear: both; text-align: left; width: fit-content;';
              applyAlignStyle('left-nowrap', leftNoWrapStyleStr);

              // 额外强制应用无包裹左对齐样式
              try {
                const imageElement = editor.view.nodeDOM(from);
                if (imageElement) {
                  const imgElement = imageElement as HTMLElement;
                  const container = imgElement.closest('.image-container') || imgElement.parentElement;
                  if (container) {
                    const containerEl = container as HTMLElement;
                    containerEl.style.float = 'none';
                    containerEl.style.display = 'block';
                    containerEl.style.marginRight = 'auto';
                    containerEl.style.marginLeft = '0';
                    containerEl.style.clear = 'both';
                    containerEl.style.textAlign = 'left';
                    containerEl.style.width = 'fit-content'; // 限制宽度为内容宽度
                  }
                }
              } catch (e) {
                console.log('强制应用左对齐无包裹样式时出错:', e);
              }
              break;
            case 'right-nowrap':
              const rightNoWrapStyleStr = 'display: block; float: none; margin-left: auto; margin-right: 0; clear: both; text-align: right; width: fit-content;';
              applyAlignStyle('right-nowrap', rightNoWrapStyleStr);

              // 额外强制应用无包裹右对齐样式
              try {
                const imageElement = editor.view.nodeDOM(from);
                if (imageElement) {
                  const imgElement = imageElement as HTMLElement;
                  const container = imgElement.closest('.image-container') || imgElement.parentElement;
                  if (container) {
                    const containerEl = container as HTMLElement;
                    containerEl.style.float = 'none';
                    containerEl.style.display = 'block';
                    containerEl.style.marginLeft = 'auto';
                    containerEl.style.marginRight = '0';
                    containerEl.style.clear = 'both';
                    containerEl.style.textAlign = 'right';
                    containerEl.style.width = 'fit-content'; // 限制宽度为内容宽度
                  }
                }
              } catch (e) {
                console.log('强制应用右对齐无包裹样式时出错:', e);
              }
              break;
            case 'delete':
              // 在删除前移除标记即可，不需要修改样式
              try {
                const imageElement = editor.view.nodeDOM(from);
                if (imageElement) {
                  const imgElement = imageElement as HTMLElement;
                  const container = imgElement.closest('.image-container') || imgElement.parentElement;
                  if (container) {
                    const containerEl = container as HTMLElement;
                    const parent = containerEl.parentElement;
                    if (parent && parent.dataset.imgCentered === 'true') {
                      // 只需要移除标记，不需要修改样式
                      delete parent.dataset.imgCentered;
                    }
                  }
                }
              } catch (e) {
                console.log('删除图片时处理标记出错:', e);
              }

              editor.chain().focus().deleteSelection().run();
              break;
          }
        } catch (error) {
          // 错误处理
        }
      };

      // 添加事件监听器
      addNativeClickListeners();

      // 使用MutationObserver监听DOM变化，确保在DOM结构变化后仍能捕获事件
      const observer = new MutationObserver(() => {
        addNativeClickListeners();
      });

      if (containerRef.current) {
        observer.observe(containerRef.current, {
          childList: true,
          subtree: true,
          attributes: true,
        });
      }

      // 返回清理函数
      return () => {
        observer.disconnect();

        // 清理事件监听器
        if (containerRef.current) {
          const buttons = containerRef.current.querySelectorAll('.image-pop-bar-item');
          buttons.forEach(button => {
            const buttonElement = button as HTMLElement;
            buttonElement.removeEventListener('click', nativeClickHandler);
            buttonElement.removeEventListener('mousedown', nativeMouseDownHandler);
          });
        }

        // 销毁工具栏实例
        if (popBarRef.current) {
          try {
            popBarRef.current.destroy();
          } catch (error) {
            // 错误处理
          }
          popBarRef.current = null;
        }
      };

    } catch (error: any) {
      setError(error?.message || '初始化失败');
      setIsInitialized(false);
      return () => {
      };
    }
  }, [editor]);

  // 处理左对齐
  const handleAlignLeft = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!editor || !editor.isEditable || !popBarRef.current) {
      return;
    }

    try {
      // 使用ImagePopBar实例的alignImage方法
      popBarRef.current.alignImage('left');
    } catch (error) {
      // 错误处理
    }
  };

  // 处理居中对齐
  const handleAlignCenter = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!editor || !editor.isEditable || !popBarRef.current) {
      return;
    }

    try {
      // 使用ImagePopBar实例的alignImage方法
      popBarRef.current.alignImage('center');
    } catch (error) {
      // 错误处理
    }
  };

  // 处理右对齐
  const handleAlignRight = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!editor || !editor.isEditable || !popBarRef.current) {
      return;
    }

    try {
      // 使用ImagePopBar实例的alignImage方法
      popBarRef.current.alignImage('right');
    } catch (error) {
      // 错误处理
    }
  };

  // 处理左对齐无包裹
  const handleAlignLeftNoWrap = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!editor || !editor.isEditable || !popBarRef.current) {
      return;
    }

    try {
      // 使用扩展的方法
      popBarRef.current.alignImage('left-nowrap');
    } catch (error) {
      // 错误处理
    }
  };

  // 处理右对齐无包裹
  const handleAlignRightNoWrap = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!editor || !editor.isEditable || !popBarRef.current) {
      return;
    }

    try {
      // 使用扩展的方法
      popBarRef.current.alignImage('right-nowrap');
    } catch (error) {
      // 错误处理
    }
  };

  // 处理删除图片
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!editor || !editor.isEditable || !popBarRef.current) {
      return;
    }

    try {
      // 使用ImagePopBar实例的deleteImage方法
      popBarRef.current.deleteImage();
    } catch (error) {
      // 错误处理
    }
  };

  return (
      <div className="image-popbar-wrapper" data-initialized={isInitialized}>
        <div
            ref={containerRef}
            className="image-pop-bar"
            data-testid="image-popbar"
            onClick={() => console.log('点击了工具栏容器')}
        >
          <div
              className="image-pop-bar-item"
              onClick={handleAlignLeftNoWrap}
              onMouseDown={(e) => e.preventDefault()}
              title="左对齐（无包裹）"
              data-testid="align-left-nowrap-btn"
          >
            <AlignLeftNoWrapIcon/>
          </div>
          <div
              className="image-pop-bar-item"
              onClick={handleAlignCenter}
              onMouseDown={(e) => e.preventDefault()}
              title="居中对齐"
              data-testid="align-center-btn"
          >
            <AlignCenterIcon/>
          </div>
          <div
              className="image-pop-bar-item"
              onClick={handleAlignRightNoWrap}
              onMouseDown={(e) => e.preventDefault()}
              title="右对齐（无包裹）"
              data-testid="align-right-nowrap-btn"
          >
            <AlignRightNoWrapIcon/>
          </div>
          <div className="image-pop-bar-separator"/>
          <div
              className="image-pop-bar-item"
              onClick={handleAlignLeft}
              onMouseDown={(e) => e.preventDefault()}
              title="左对齐（文字包裹）"
              data-testid="align-left-btn"
          >
            <AlignLeftIcon/>
          </div>
          <div
              className="image-pop-bar-item"
              onClick={handleAlignRight}
              onMouseDown={(e) => e.preventDefault()}
              title="右对齐（文字包裹）"
              data-testid="align-right-btn"
          >
            <AlignRightIcon/>
          </div>
          <div className="image-pop-bar-separator"/>
          <div
              className="image-pop-bar-item"
              onClick={handleDelete}
              onMouseDown={(e) => e.preventDefault()}
              title="删除图片"
              data-testid="delete-btn"
          >
            <DeleteIcon/>
          </div>
        </div>
        {error && <div className="image-popbar-error" style={{display: 'none'}}>{error}</div>}
      </div>
  );
};

export default ImagePopBarComponent;
