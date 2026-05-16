import {Editor, isNodeSelection, posToDOMRect} from '@tiptap/core';
import tippy, {Instance, Props as TippyOptions, sticky} from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/shift-away.css';
import 'tippy.js/themes/light.css';
import './ImagePopBar.css';

export interface ImagePopBarOptions {
  editor: Editor;
  element: HTMLElement;
  tippyOptions?: Partial<TippyOptions>;
}

export class ImagePopBar {
  editor: Editor;
  element: HTMLElement;
  tippyOptions: Partial<TippyOptions>;
  tippyInstance: Instance | null = null;
  referenceElement: HTMLElement | null = null;
  // 存储当前选中的图片节点位置和DOM元素
  currentImagePos: number | null = null;
  currentImageElement: HTMLElement | null = null;

  constructor({editor, element, tippyOptions = {}}: ImagePopBarOptions) {
    this.editor = editor;
    this.element = element;
    this.tippyOptions = {
      appendTo: document.body,
      content: element,
      hideOnClick: false,
      interactive: true,
      interactiveBorder: 10,
      interactiveDebounce: 0,
      trigger: 'manual',
      placement: 'top',
      plugins: [sticky],
      sticky: true,
      arrow: false,
      animation: 'shift-away',
      duration: [300, 200],
      inertia: true,
      maxWidth: 'none',
      role: 'tooltip',
      theme: 'image-pop-bar',
      touch: ['hold', 500],
      triggerTarget: document.body,
      ...tippyOptions,
    };

    this.init();
  }

  // 设置当前选中的图片节点信息
  setCurrentImage(pos: number, element: HTMLElement) {
    this.currentImagePos = pos;
    this.currentImageElement = element;
  }

  // 获取当前图片的容器元素
  getCurrentImageContainer(): HTMLElement | null {
    if (!this.currentImageElement) return null;

    // 查找图片容器
    if (this.currentImageElement.classList.contains('image-container')) {
      return this.currentImageElement;
    }

    // 寻找父级容器
    const container = this.currentImageElement.closest('.image-container');
    return container as HTMLElement || this.currentImageElement;
  }

  // 对齐图片方法
  alignImage(align: 'left' | 'center' | 'right' | 'left-nowrap' | 'right-nowrap') {
    if (!this.currentImagePos || !this.currentImageElement) {
      // 再次尝试从当前选区中获取图片信息
      const {selection} = this.editor.state;
      if (isNodeSelection(selection) && selection.node.type.name === 'image') {
        const pos = selection.from;
        const element = this.editor.view.nodeDOM(pos) as HTMLElement;
        if (element) {
          this.setCurrentImage(pos, element);
        } else {
          return false;
        }
      } else {
        return false;
      }
    }

    try {
      // 1. 尝试直接操作DOM (更直接，立即生效)
      const container = this.getCurrentImageContainer();
      if (container) {
        // 移除之前的对齐类
        container.classList.remove('image-align-left', 'image-align-center', 'image-align-right', 'image-align-left-nowrap', 'image-align-right-nowrap');

        // 根据对齐方式设置样式
        let styleStr = '';
        switch (align) {
          case 'left':
            styleStr = 'float: left; margin-right: 10px; margin-left: 0; clear: left;';
            container.classList.add('image-align-left');
            container.style.float = 'left';
            container.style.marginRight = '10px';
            container.style.marginLeft = '0';
            container.style.clear = 'left';
            break;
          case 'center':
            styleStr = 'float: none; margin-left: auto; margin-right: auto; display: block; clear: both; text-align: center; width: fit-content;';
            container.classList.add('image-align-center');
            container.style.float = 'none';
            container.style.display = 'block';
            container.style.marginLeft = 'auto';
            container.style.marginRight = 'auto';
            container.style.clear = 'both';
            container.style.textAlign = 'center';
            container.style.width = 'fit-content'; // 限制容器宽度为内容宽度

            // 额外处理：强制图片居中
            const img = container.querySelector('img');
            if (img) {
              img.style.marginLeft = 'auto';
              img.style.marginRight = 'auto';
              img.style.display = 'block';
              // 设置对齐属性
              img.setAttribute('align', align);
              img.setAttribute('data-align', align);
            }

            // 处理父元素 - 不再设置文本居中
            if (container.parentElement) {
              // 仍然添加标记，用于在删除图片时识别
              container.parentElement.dataset.imgCentered = 'true';
            }
            break;
          case 'right':
            styleStr = 'float: right; margin-left: 10px; margin-right: 0; clear: right;';
            container.classList.add('image-align-right');
            container.style.float = 'right';
            container.style.marginLeft = '10px';
            container.style.marginRight = '0';
            container.style.clear = 'right';
            break;
          case 'left-nowrap':
            styleStr = 'display: block; float: none; margin-right: auto; margin-left: 0; clear: both; text-align: left; width: fit-content;';
            container.classList.add('image-align-left-nowrap');
            container.style.float = 'none';
            container.style.display = 'block';
            container.style.marginRight = 'auto';
            container.style.marginLeft = '0';
            container.style.clear = 'both';
            container.style.textAlign = 'left';
            container.style.width = 'fit-content'; // 限制宽度为内容宽度
            break;
          case 'right-nowrap':
            styleStr = 'display: block; float: none; margin-left: auto; margin-right: 0; clear: both; text-align: right; width: fit-content;';
            container.classList.add('image-align-right-nowrap');
            container.style.float = 'none';
            container.style.display = 'block';
            container.style.marginLeft = 'auto';
            container.style.marginRight = '0';
            container.style.clear = 'both';
            container.style.textAlign = 'right';
            container.style.width = 'fit-content'; // 限制宽度为内容宽度
            break;
        }

        // 直接设置style属性，确保样式优先级
        container.setAttribute('style', styleStr);
        // 设置对齐和数据属性
        container.setAttribute('align', align);
        container.setAttribute('data-align', align);
      }

      // 2. 同时通过编辑器命令更新节点属性 (确保保存状态正确)
      // 获取当前选区
      const {selection} = this.editor.state;

      // 如果当前没有选中图片，尝试重新选中
      if (!isNodeSelection(selection) || selection.node.type.name !== 'image') {
        // 确保图片位置有效
        if (this.currentImagePos !== null) {
          // 尝试选中图片节点
          this.editor.commands.setNodeSelection(this.currentImagePos);
        }
      }

      // 执行更新命令
      const result = this.editor.chain().focus().command(({tr}) => {
        // 再次获取当前选区
        const updatedSelection = this.editor.state.selection;

        // 确定要更新的节点位置
        let nodePos = this.currentImagePos;
        let nodeAttrs = {};

        // 如果当前选中了图片，使用选区信息
        if (isNodeSelection(updatedSelection) &&
            updatedSelection.node.type.name === 'image') {
          nodePos = updatedSelection.from;
          nodeAttrs = updatedSelection.node.attrs;
        } else if (this.currentImagePos !== null) {
          // 使用保存的图片位置
          const node = this.editor.state.doc.nodeAt(this.currentImagePos);
          if (node && node.type.name === 'image') {
            nodeAttrs = node.attrs;
          } else {
            return false;
          }
        } else {
          return false;
        }

        // 检查nodePos是否合法
        if (nodePos === null) {
          return false;
        }

        // 根据对齐方式设置样式字符串
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
          case 'left-nowrap':
            styleStr = 'display: block; float: none; margin-right: auto; margin-left: 0; clear: both; text-align: left; width: fit-content;';
            break;
          case 'right-nowrap':
            styleStr = 'display: block; float: none; margin-left: auto; margin-right: 0; clear: both; text-align: right; width: fit-content;';
            break;
        }

        // 设置节点的新属性
        const newAttrs = {
          ...nodeAttrs,
          style: styleStr,
          align: align,
          'data-align': align, // 添加data属性以确保持久化
          class: `image-align-${align}`
        };

        // 更新节点
        tr.setNodeMarkup(nodePos as number, undefined, newAttrs);

        return true;
      }).run();

      return true;
    } catch (error) {
      return false;
    }
  }

  // 删除当前图片
  deleteImage() {
    if (!this.currentImagePos) {
      return false;
    }

    try {
      // 在删除前，先恢复父元素的样式
      const container = this.getCurrentImageContainer();
      if (container && container.parentElement) {
        // 检查是否有居中标记
        if (container.parentElement.dataset.imgCentered === 'true') {
          // 移除标记
          delete container.parentElement.dataset.imgCentered;
        }
      }

      // 执行删除操作
      this.editor.chain().focus().deleteSelection().run();
      this.hide(); // 删除后隐藏工具栏
      return true;
    } catch (error) {
      return false;
    }
  }

  init() {
    // 创建一个真实的DOM元素作为tippy的引用对象
    const referenceEl = document.createElement('div');
    referenceEl.style.position = 'absolute';
    referenceEl.style.width = '0';
    referenceEl.style.height = '0';
    referenceEl.style.pointerEvents = 'none';
    referenceEl.style.opacity = '0';
    referenceEl.setAttribute('id', 'image-popbar-reference');
    document.body.appendChild(referenceEl);

    this.referenceElement = referenceEl;

    // 初始化Tippy实例
    this.tippyInstance = tippy(referenceEl, {
      ...this.tippyOptions,
      // 每次显示前更新位置
      onShow: (instance) => {
        this.updatePosition();
        // 确保元素可见并启用交互
        if (this.element) {
          this.element.style.visibility = 'visible';
          this.element.style.pointerEvents = 'auto';

          // 确保内部按钮也能接收点击事件
          const buttons = this.element.querySelectorAll('.image-pop-bar-item');
          buttons.forEach(button => {
            (button as HTMLElement).style.pointerEvents = 'auto';
          });
        }
      },
      onClickOutside: (instance, event) => {
        // 检查是否点击在编辑器内部但不在工具栏内
        // 使用 editor.view.dom 获取编辑器 DOM 元素，更可靠
        const editorElement = this.editor.view.dom;
        const isInEditor = editorElement?.contains(event.target as Node);
        const isInToolbar = this.element.contains(event.target as Node);

        if (!isInToolbar && !event.defaultPrevented) {
          this.hide();
        }
      }
    });

    // 将工具栏元素样式修改为可见
    this.element.style.visibility = 'visible';
    this.element.style.position = 'static';
    this.element.style.pointerEvents = 'auto';

    // 为工具栏添加点击事件，防止点击工具栏时隐藏
    this.element.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // 为工具栏内的按钮添加点击事件监听
    const buttons = this.element.querySelectorAll('.image-pop-bar-item');
    buttons.forEach(button => {
      const buttonElement = button as HTMLElement;
      buttonElement.style.pointerEvents = 'auto';

      // 确保按钮点击事件不会冒泡到外部
      buttonElement.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    });

    // 监听编辑器事件
    this.editor.on('selectionUpdate', this.onSelectionUpdate);
    this.editor.on('transaction', this.onTransaction);
    this.editor.on('focus', this.onSelectionUpdate);
    this.editor.on('blur', () => {
      // 检查点击是否在工具栏内部
      setTimeout(() => {
        // 延迟判断，因为blur事件发生在click之前
        const activeElement = document.activeElement;
        const isInsideToolbar = activeElement instanceof HTMLElement && (
            this.element.contains(activeElement) ||
            activeElement.closest('.image-pop-bar') !== null
        );

        if (!isInsideToolbar) {
          this.hide();
        }
      }, 100);
    });
    this.editor.on('destroy', this.destroy);

    // 立即检查是否有选中的图片
    this.update();

    // 定期更新位置，保证工具栏正确定位
    setInterval(() => {
      if (this.tippyInstance?.state.isShown) {
        this.updatePosition();
      }
    }, 300);
  }

  updatePosition() {
    if (!this.referenceElement) return;

    const rect = this.getReferenceRect();

    // 更新引用元素位置
    this.referenceElement.style.left = `${rect.left + window.scrollX}px`;
    this.referenceElement.style.top = `${rect.top + window.scrollY}px`;
  }

  // 在DOM中查找图片容器并获取其位置信息
  getReferenceRect(): DOMRect {
    try {
      // 优先使用已保存的图片元素信息
      if (this.currentImageElement) {
        // 尝试获取图片容器
        const container = this.getCurrentImageContainer();
        if (container) {
          const rect = container.getBoundingClientRect();

          // 返回图片顶部中间位置
          return new DOMRect(
              rect.left + rect.width / 2,
              rect.top,
              0,
              0
          );
        }
      }

      // 如果没有已保存的图片元素，则使用选区信息
      const {state, view} = this.editor;
      const {selection} = state;

      if (isNodeSelection(selection) &&
          selection.node.type.name === 'image') {

        const {from} = selection;
        const node = view.nodeDOM(from);

        if (node && node instanceof HTMLElement) {
          let imageElement: HTMLElement = node;

          // 如果是图片容器，查找内部的图片元素
          if (node.classList.contains('image-container')) {
            imageElement = node;
          } else {
            // 尝试查找最近的图片容器
            const container = node.closest('.image-container');
            if (container) {
              imageElement = container as HTMLElement;
            }
          }

          // 保存找到的图片信息（如果之前没有设置）
          if (!this.currentImageElement) {
            this.setCurrentImage(from, imageElement);
          }

          const rect = imageElement.getBoundingClientRect();

          // 返回图片顶部中间位置
          return new DOMRect(
              rect.left + rect.width / 2,
              rect.top,
              0,
              0
          );
        }
      }

      // 回退到默认位置
      const {from, to} = selection;
      return posToDOMRect(view, from, to);
    } catch (error) {
      return new DOMRect(0, 0, 0, 0);
    }
  }

  onSelectionUpdate = () => {
    this.update();
  }

  onTransaction = () => {
    this.update();
  }

  update() {
    const {state} = this.editor;
    const {selection} = state;

    try {
      if (isNodeSelection(selection) &&
          selection.node.type.name === 'image' &&
          this.editor.isEditable) {

        // 保存当前选中图片的位置和DOM元素
        const nodePos = selection.from;
        const nodeDOM = this.editor.view.nodeDOM(nodePos) as HTMLElement;

        if (nodeDOM) {
          // 设置当前图片信息
          this.setCurrentImage(nodePos, nodeDOM);
        }

        this.show();
      } else {
        this.hide();
        // 清除图片引用
        this.currentImagePos = null;
        this.currentImageElement = null;
      }
    } catch (error) {
      this.hide();
    }
  }

  show() {
    if (this.tippyInstance) {
      this.updatePosition();
      this.tippyInstance.show();
    }
  }

  hide() {
    if (this.tippyInstance) {
      this.tippyInstance.hide();
    }
  }

  destroy = () => {
    this.hide();

    // 移除事件监听
    this.editor.off('selectionUpdate', this.onSelectionUpdate);
    this.editor.off('transaction', this.onTransaction);
    this.editor.off('focus', this.onSelectionUpdate);

    // 销毁Tippy实例
    if (this.tippyInstance) {
      this.tippyInstance.destroy();
      this.tippyInstance = null;
    }

    // 移除引用元素
    if (this.referenceElement && this.referenceElement.parentNode) {
      this.referenceElement.parentNode.removeChild(this.referenceElement);
      this.referenceElement = null;
    }
  }
}
