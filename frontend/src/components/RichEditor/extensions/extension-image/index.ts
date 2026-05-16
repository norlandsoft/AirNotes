import {Image as TImage} from '@tiptap/extension-image';
import {isNodeSelection} from '@tiptap/core';

// 添加CSS样式
const createResizableImageStyles = () => {
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    .image-container {
      position: relative;
      display: inline-block;
    }
    .image-container img {
      display: block;
    }
    /* 在可编辑模式下，所有图片添加1px透明边框 */
    [contenteditable="true"] .image-container img {
      border: 1px solid transparent;
    }
    .resize-handle {
      position: absolute;
      width: 6px;
      background-color: #E9F1FF;
      border-radius: 2px;
      top: 0;
      bottom: 0;
      opacity: 0;
      z-index: 100;
      transition: opacity 0.2s ease;
    }
    .resize-handle-line {
      position: absolute;
      width: 4px;
      background-color: #0D46A1;
      height: 20%;
      top: 50%;
      transform: translate(-50%, -50%);
      left: 50%;
    }
    .resize-handle.left {
      left: 0;
      cursor: col-resize;
    }
    .resize-handle.right {
      right: 0;
      cursor: col-resize;
    }
    /* 选中状态下图片添加蓝色边框 */
    [contenteditable="true"] .image-container.selected img {
      border: 1px solid #0096fd;
    }
    /* 只在编辑状态下且鼠标悬停或被选中时显示控制点 */
    [contenteditable="true"] .image-container.hovered .resize-handle,
    [contenteditable="true"] .image-container.selected .resize-handle {
      opacity: 1;
    }
    /* 在只读状态下隐藏控制点 */
    [contenteditable="false"] .image-container .resize-handle {
      display: none;
    }
    /* 确保图片对齐方式样式优先级 */
    .image-container.image-align-left {
      float: left !important;
      margin-right: 10px !important;
      margin-left: 0 !important;
      clear: left !important;
    }
    .image-container.image-align-center {
      float: none !important;
      margin-left: auto !important;
      margin-right: auto !important;
      display: block !important;
      clear: both !important;
      text-align: center !important;
      width: fit-content !important;
      max-width: 100% !important; /* 防止溢出 */
      /* 不影响其他内容的对齐方式 */
      box-sizing: border-box !important;
    }
    /* 强制居中图片 */
    .image-container.image-align-center img {
      margin-left: auto !important;
      margin-right: auto !important;
      display: block !important;
    }
    /* 处理父容器居中 */
    .ProseMirror div:has(> .image-container.image-align-center) {
      /* 注释掉可能影响所有内容的居中样式 */
      /* text-align: center !important; */
    }
    /* 替代方案：只为图片内部元素应用居中样式 */
    .image-container.image-align-center img {
      margin-left: auto !important;
      margin-right: auto !important;
      display: block !important;
      max-width: 100% !important; /* 防止溢出 */
    }
    /* 提供更好的调整大小体验 */
    .image-container.image-align-center .resize-handle {
      top: 0;
      height: 100%;
    }
    .image-container.image-align-center .resize-handle.left {
      left: 0;
    }
    .image-container.image-align-center .resize-handle.right {
      right: 0;
    }
    .image-container.image-align-right {
      float: right !important;
      margin-left: 10px !important;
      margin-right: 0 !important;
      clear: right !important;
    }
  `;
  document.head.appendChild(styleElement);
};

// 确保样式只添加一次
let stylesAdded = false;

export const Image = TImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '300px',
        parseHTML: (element) => element.getAttribute('width') || '300px',
        renderHTML: (attributes) => {
          if (!attributes.width) {
            return {};
          }
          return {width: attributes.width};
        },
      },
      height: {
        default: null,
        parseHTML: (element) => element.getAttribute('height'),
        renderHTML: (attributes) => {
          if (!attributes.height) {
            return {};
          }
          return {height: attributes.height};
        },
      },
      aspectRatio: {
        default: null,
        parseHTML: () => null,
      },
      align: {
        default: null,
        parseHTML: (element) => element.getAttribute('align') || element.getAttribute('data-align'),
        renderHTML: (attributes) => {
          if (!attributes.align) {
            return {};
          }
          return {
            'align': attributes.align,
            'data-align': attributes.align,
          };
        },
      },
      style: {
        default: null,
        parseHTML: (element) => element.getAttribute('style'),
        renderHTML: (attributes) => {
          if (!attributes.style) {
            return {};
          }
          return {style: attributes.style};
        },
      },
      class: {
        default: null,
        parseHTML: (element) => element.getAttribute('class'),
        renderHTML: (attributes) => {
          if (!attributes.class) {
            return {};
          }
          return {class: attributes.class};
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'img[src]',
        getAttrs: (node) => {
          if (typeof node === 'string') return {};
          const element = node as HTMLElement;
          const align = element.getAttribute('align') || element.getAttribute('data-align');

          // 如果有align属性，确保添加对应的CSS类
          if (align) {
            const cssClass = `image-align-${align}`;
            if (!element.classList.contains(cssClass)) {
              element.classList.add(cssClass);
            }

            // 如果没有style属性，根据align添加合适的样式
            if (!element.getAttribute('style')) {
              let styleStr = '';
              switch (align) {
                case 'left':
                  styleStr = 'float: left; margin-right: 10px; margin-left: 0; clear: left;';
                  break;
                case 'center':
                  styleStr = 'float: none; margin-left: auto; margin-right: auto; display: block; clear: both; text-align: center; width: fit-content;';
                  break;
                case 'right':
                  styleStr = 'float: right; margin-left: 10px; margin-right: 0; clear: right;';
                  break;
              }

              if (styleStr) {
                element.setAttribute('style', styleStr);
              }
            }
          }

          return {};
        }
      }
    ]
  },

  renderHTML({HTMLAttributes, node}) {
    const {align} = HTMLAttributes;

    // 确保align属性映射到对应的CSS类
    if (align && !HTMLAttributes.class) {
      HTMLAttributes.class = `image-align-${align}`;
    } else if (align && HTMLAttributes.class && !HTMLAttributes.class.includes(`image-align-${align}`)) {
      HTMLAttributes.class += ` image-align-${align}`;
    }

    // 如果有align但没有样式，添加适当的样式
    if (align && !HTMLAttributes.style) {
      switch (align) {
        case 'left':
          HTMLAttributes.style = 'float: left; margin-right: 10px; margin-left: 0; clear: left;';
          break;
        case 'center':
          HTMLAttributes.style = 'float: none; margin-left: auto; margin-right: auto; display: block; clear: both; text-align: center; width: fit-content;';
          break;
        case 'right':
          HTMLAttributes.style = 'float: right; margin-left: 10px; margin-right: 0; clear: right;';
          break;
      }
    }

    // 使用标准的img标签渲染，包含所有必要的属性
    return ['img', HTMLAttributes];
  },

  addNodeView() {
    return ({node, HTMLAttributes, getPos, editor}) => {
      // 确保样式已添加
      if (!stylesAdded) {
        createResizableImageStyles();
        stylesAdded = true;
      }

      const {aspectRatio, align} = node.attrs;
      const container = document.createElement('div');
      container.classList.add('image-container');

      // 如果有对齐属性，添加相应的CSS类和样式
      if (align) {
        container.classList.add(`image-align-${align}`);
        container.setAttribute('align', align);
        container.setAttribute('data-align', align);

        // 根据对齐方式设置样式
        let styleStr = '';
        switch (align) {
          case 'left':
            styleStr = 'float: left; margin-right: 10px; margin-left: 0; clear: left;';
            break;
          case 'center':
            styleStr = 'float: none; margin-left: auto; margin-right: auto; display: block; clear: both; text-align: center; width: fit-content;';
            break;
          case 'right':
            styleStr = 'float: right; margin-left: 10px; margin-right: 0; clear: right;';
            break;
        }

        if (styleStr) {
          container.setAttribute('style', styleStr);
        }
      }

      const img = document.createElement('img');
      Object.entries(HTMLAttributes).forEach(([key, value]) => {
        img.setAttribute(key, value as string);
      });

      // 立即应用初始宽高样式
      if (node.attrs.width) {
        img.style.width = node.attrs.width;
      }
      if (node.attrs.height) {
        img.style.height = node.attrs.height;
      }

      // 如果有align属性，设置到img元素上
      if (align) {
        img.setAttribute('align', align);
        img.setAttribute('data-align', align);
      }

      // 添加调整大小的控制点
      const createResizeHandle = (position: string) => {
        const handle = document.createElement('div');
        handle.classList.add('resize-handle', position);
        // 设置内联样式确保显示
        handle.style.position = 'absolute';
        handle.style.width = '6px';
        handle.style.backgroundColor = '#E9F1FF';
        handle.style.borderRadius = '2px';
        handle.style.top = '0';
        handle.style.bottom = '0';
        handle.style.zIndex = '100';

        // 添加中间的深色线条
        const line = document.createElement('div');
        line.classList.add('resize-handle-line');
        line.style.position = 'absolute';
        line.style.width = '4px';
        line.style.backgroundColor = '#0D46A1';
        line.style.height = '20%';
        line.style.top = '50%';
        line.style.left = '50%';
        line.style.transform = 'translate(-50%, -50%)';
        handle.appendChild(line);

        if (position === 'left') {
          handle.style.left = '0'; // 紧贴图片左侧
          handle.style.cursor = 'col-resize';
        } else {
          handle.style.right = '0'; // 紧贴图片右侧
          handle.style.cursor = 'col-resize';
        }

        container.appendChild(handle);
        return handle;
      };

      // 创建左右两侧的控制点
      const leftHandle = createResizeHandle('left');
      const rightHandle = createResizeHandle('right');

      // 跟踪鼠标和选中状态
      let isHovered = false;
      let isSelected = false;
      let isOnHandle = false; // 跟踪鼠标是否在控制点上

      // 更新控制点可见性
      const updateHandleVisibility = () => {
        if (editor.isEditable && (isHovered || isSelected || isOnHandle)) {
          leftHandle.style.display = '';
          leftHandle.style.opacity = '1';
          rightHandle.style.display = '';
          rightHandle.style.opacity = '1';
        } else {
          leftHandle.style.display = 'none';
          rightHandle.style.display = 'none';
        }
      };

      // 添加鼠标悬停事件
      const onMouseEnter = () => {
        isHovered = true;
        container.classList.add('hovered');
        updateHandleVisibility();
      };

      const onMouseLeave = () => {
        isHovered = false;
        container.classList.remove('hovered');
        if (!isOnHandle) {
          updateHandleVisibility();
        }
      };

      // 控制点的鼠标事件处理
      const onHandleMouseEnter = () => {
        isOnHandle = true;
        updateHandleVisibility();
      };

      const onHandleMouseLeave = () => {
        isOnHandle = false;
        if (!isHovered) {
          updateHandleVisibility();
        }
      };

      // 为控制点添加鼠标事件
      leftHandle.addEventListener('mouseenter', onHandleMouseEnter);
      leftHandle.addEventListener('mouseleave', onHandleMouseLeave);
      rightHandle.addEventListener('mouseenter', onHandleMouseEnter);
      rightHandle.addEventListener('mouseleave', onHandleMouseLeave);

      // 监听鼠标事件
      container.addEventListener('mouseenter', onMouseEnter);
      container.addEventListener('mouseleave', onMouseLeave);

      // 检查图片是否被选中
      const checkIfSelected = () => {
        if (!editor || !editor.state || !getPos || typeof getPos !== 'function') {
          return;
        }

        const {selection} = editor.state;
        const nodePos = getPos();

        // 使用isNodeSelection检查是否为节点选择，且选中的是当前节点
        isSelected = isNodeSelection(selection) && selection.anchor === nodePos;

        if (isSelected) {
          container.classList.add('selected');
        } else {
          container.classList.remove('selected');
        }

        updateHandleVisibility();
      };

      // 监听编辑器选择变化
      const onSelectionUpdate = () => {
        checkIfSelected();
      };

      if (editor) {
        editor.on('selectionUpdate', onSelectionUpdate);
      }

      // 初始化时设置控制点可见性
      updateHandleVisibility();

      // 设置加载事件处理器
      img.onload = () => {
        if (!aspectRatio) {
          const ratio = img.naturalWidth / img.naturalHeight;
          const transaction = editor.state.tr;

          if (getPos && typeof getPos === 'function') {
            const pos = getPos();
            if (typeof pos === 'number') {
              const width = parseInt(node.attrs.width || '300');
              const height = Math.round(width / ratio);

              transaction.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                aspectRatio: ratio,
                height: `${height}px`,
              });
              editor.view.dispatch(transaction);

              // 确保样式显式设置到DOM元素
              img.style.width = `${width}px`;
              img.style.height = `${height}px`;
            }
          }
        } else {
          // 如果已有宽高比，确保DOM元素样式与属性一致
          const width = parseInt(node.attrs.width || '300');
          const height = aspectRatio ? Math.round(width / aspectRatio) : null;

          if (width) {
            img.style.width = `${width}px`;
            if (height) {
              img.style.height = `${height}px`;
            }
          }
        }

        // 检查是否选中
        checkIfSelected();
        // 更新控制点高度
        updateHandleHeight();
      };

      // 更新控制点高度
      const updateHandleHeight = () => {
        // 更新深色线条的高度为图片高度的30%
        const imgHeight = img.getBoundingClientRect().height;
        const lineHeight = Math.max(imgHeight * 0.3, 20); // 至少20px高

        const leftLine = leftHandle.querySelector('.resize-handle-line') as HTMLElement;
        const rightLine = rightHandle.querySelector('.resize-handle-line') as HTMLElement;

        if (leftLine) leftLine.style.height = `${lineHeight}px`;
        if (rightLine) rightLine.style.height = `${lineHeight}px`;
      };

      // 实现拖动调整大小的功能
      const addResizeListener = (handle: HTMLElement, isRight: boolean) => {
        let startX = 0;
        let startWidth = 0;

        const onMouseDown = (e: MouseEvent) => {
          // 如果编辑器处于只读状态，不允许调整大小
          if (!editor.isEditable) {
            return;
          }

          e.preventDefault();
          e.stopPropagation(); // 防止事件冒泡
          startX = e.clientX;
          startWidth = img.getBoundingClientRect().width;

          document.addEventListener('mousemove', onMouseMove);
          document.addEventListener('mouseup', onMouseUp);

          // 添加一个临时类，表示正在调整大小
          container.classList.add('resizing');
        };

        const onMouseMove = (e: MouseEvent) => {
          // 修改拖动逻辑：右侧控制点不变，左侧控制点改为向左拉伸，向右缩小
          let dx;
          if (isRight) {
            // 右侧控制点逻辑不变：向右拉伸，向左缩小
            dx = e.clientX - startX;
          } else {
            // 左侧控制点新逻辑：向左拉伸，向右缩小
            dx = startX - e.clientX;
          }

          const newWidth = startWidth + dx;

          if (newWidth > 50) { // 最小宽度限制
            // 根据比例计算高度
            const newHeight = aspectRatio ? Math.round(newWidth / aspectRatio) : img.getBoundingClientRect().height;

            img.style.width = `${newWidth}px`;
            img.style.height = `${newHeight}px`;

            // 更新控制点的高度
            updateHandleHeight();
          }
        };

        const onMouseUp = () => {
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);

          // 拖动结束后更新节点属性
          const width = img.getBoundingClientRect().width;
          const height = img.getBoundingClientRect().height;

          if (getPos && typeof getPos === 'function') {
            const pos = getPos();
            if (typeof pos === 'number') {
              const transaction = editor.state.tr;
              transaction.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                width: `${Math.round(width)}px`,
                height: `${Math.round(height)}px`,
              });
              editor.view.dispatch(transaction);
            }

            // 添加: 确保样式直接应用到DOM元素
            setTimeout(() => {
              if (img) {
                img.style.width = `${Math.round(width)}px`;
                img.style.height = `${Math.round(height)}px`;
                // 主动触发DOM更新
                window.requestAnimationFrame(() => {
                  updateHandleHeight();
                });
              }
            }, 0);
          }

          // 移除调整大小的类
          container.classList.remove('resizing');
        };

        handle.addEventListener('mousedown', onMouseDown);

        return () => {
          handle.removeEventListener('mousedown', onMouseDown);
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
        };
      };

      // 添加拖动事件监听
      const cleanupLeft = addResizeListener(leftHandle, false);
      const cleanupRight = addResizeListener(rightHandle, true);

      // 确保图片加载后控制点位置正确
      img.addEventListener('load', updateHandleHeight);

      // 监听编辑器状态变化
      const editorObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === 'attributes' &&
              mutation.attributeName === 'contenteditable') {
            updateHandleVisibility();
          }
        }
      });

      // 开始观察编辑器的contenteditable属性变化
      if (editor && editor.view && editor.view.dom) {
        editorObserver.observe(editor.view.dom, {
          attributes: true,
          attributeFilter: ['contenteditable']
        });
      }

      // 仍然保留原有的MutationObserver，以防通过其他方式修改宽度
      const observer = new MutationObserver(() => {
        if (img.getAttribute('width') && aspectRatio) {
          const width = parseInt(img.getAttribute('width') || '300');
          const height = Math.round(width / aspectRatio);
          img.setAttribute('height', `${height}px`);

          // 更新节点属性
          if (getPos && typeof getPos === 'function') {
            const pos = getPos();
            if (typeof pos === 'number') {
              const transaction = editor.state.tr;
              transaction.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                width: `${width}px`,
                height: `${height}px`,
              });
              editor.view.dispatch(transaction);
            }
          }
        }
      });

      observer.observe(img, {attributes: true, attributeFilter: ['width']});

      // 先添加图片，确保控制点在图片上方
      container.appendChild(img);

      // 清理函数
      const destroy = () => {
        observer.disconnect();
        editorObserver.disconnect();
        img.removeEventListener('load', updateHandleHeight);
        container.removeEventListener('mouseenter', onMouseEnter);
        container.removeEventListener('mouseleave', onMouseLeave);
        leftHandle.removeEventListener('mouseenter', onHandleMouseEnter);
        leftHandle.removeEventListener('mouseleave', onHandleMouseLeave);
        rightHandle.removeEventListener('mouseenter', onHandleMouseEnter);
        rightHandle.removeEventListener('mouseleave', onHandleMouseLeave);
        if (editor) {
          editor.off('selectionUpdate', onSelectionUpdate);
        }
        cleanupLeft();
        cleanupRight();
      };

      return {dom: container, contentDOM: null, destroy};
    };
  },

  // 扩展命令
  addCommands() {
    return {
      ...this.parent?.() || {},

      // 添加删除图片时恢复样式的命令
      deleteImage: () => ({tr, state, dispatch}) => {
        const {selection} = state;
        if (!isNodeSelection(selection) || selection.node.type.name !== 'image') {
          return false;
        }

        if (dispatch) {
          // 执行常规删除
          tr.deleteSelection();
          dispatch(tr);
        }

        return true;
      },
    };
  },
});
