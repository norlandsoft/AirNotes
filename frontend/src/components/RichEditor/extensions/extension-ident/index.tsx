import {Extension} from '@tiptap/core'
import {Plugin, PluginKey} from '@tiptap/pm/state'

interface IndentExtensionOptions {
  maxIndent: number
  minIndent: number
  indentStep: number
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    IndentExtension: {
      // 定义命令
      setIndent: () => ReturnType
      isAtMinIndent: () => ReturnType
      removeIndent: () => ReturnType
    }
  }
}

export const Indent = Extension.create<IndentExtensionOptions>({
  // 扩展名称
  name: 'IndentExtension',

  // 默认配置
  addOptions() {
    return {
      maxIndent: 12,
      minIndent: 0,
      indentStep: 2,
    }
  },

  // 添加全局属性
  addGlobalAttributes() {
    return [
      {
        // 可以应用这些属性的节点类型
        types: ['paragraph', 'heading', 'listItem'],
        // 定义属性
        attributes: {
          indent: {
            default: 0,
            // 渲染到 HTML
            renderHTML: attributes => {
              return {
                style: `margin-left: ${attributes.indent}em;`
              }
            },
            // 从 HTML 解析
            parseHTML: element => {
              const indent = element.style.marginLeft;
              if (indent) {
                return parseInt(indent);
              }
              return 0;
            },
          }
        },
      },
    ]
  },

  // 添加命令
  addCommands() {
    return {
      setIndent: () => ({tr, state}) => {
        const {selection} = state;
        let hasChanged = false;

        state.doc.nodesBetween(selection.from, selection.to, (node, pos, parent) => {
          // 检查节点类型并确保如果是 paragraph，其父节点不是 listItem
          if ((node.type.name === 'heading') ||
              (node.type.name === 'listItem') ||
              (node.type.name === 'paragraph' && parent?.type.name !== 'listItem')) {
            const currentIndent = node.attrs.indent || 0;
            const newIndent = Math.min(this.options.maxIndent, currentIndent + this.options.indentStep);

            if (currentIndent !== newIndent) {
              tr.setNodeMarkup(pos, null, {
                ...node.attrs,
                indent: newIndent,
              });
              hasChanged = true;
            }
          }
        });

        return hasChanged;
      },

      isAtMinIndent: () => ({state}) => {
        const {selection} = state;
        let indent = 0;
        state.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
          if (node.type.name === 'paragraph' || node.type.name === 'heading' || node.type.name === 'listItem') {
            indent = node.attrs.indent;
          }
        });
        return indent === this.options.minIndent;
      },

      removeIndent: () => ({tr, state}) => {
        const {selection} = state;
        let hasChanged = false;

        // 遍历选中的内容
        state.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
          if (node.type.name === 'paragraph' || node.type.name === 'heading' || node.type.name === 'listItem') {
            const currentIndent = node.attrs.indent || 0;
            const newIndent = Math.max(this.options.minIndent, currentIndent - this.options.indentStep);

            if (currentIndent !== newIndent) {
              tr.setNodeMarkup(pos, null, {
                ...node.attrs,
                indent: newIndent,
              });
              hasChanged = true;
            }
          }
        });

        return hasChanged;
      },
    }
  },

  // 添加键盘快捷键
  addKeyboardShortcuts() {
    return {
      'Tab': () => this.editor.commands.setIndent(),
      'Backspace': ({editor}) => {
        // 判断光标是否在行首
        const {selection} = editor.state;
        const {empty, anchor} = selection;
        const resolvedPos = editor.state.doc.resolve(anchor);
        const isAtStart = resolvedPos.parentOffset === 0;

        const isAtMinIndent = this.editor.commands.isAtMinIndent();
        if (empty && isAtStart && !isAtMinIndent) {
          this.editor.commands.removeIndent();
          return true
        }
        return false
      },
    }
  },

  // 添加输入规则
  addInputRules() {
    return [
      {
        find: /^>>>$/,
        handler: ({state, chain, range}) => {
          chain()
              .deleteRange({from: range.from, to: range.to}) // 删除 ">>>"
              .setIndent()
              .run()
        },
        undoable: true, // 标记为可撤销
      },
    ]
  },

  // 添加 ProseMirror 插件
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('indentExtensionPlugin'),
        // 处理视图更新
        view: () => ({
          update: (view, prevState) => {
            // 在这里处理视图更新逻辑
          },
        }),
      }),
    ]
  },
})
