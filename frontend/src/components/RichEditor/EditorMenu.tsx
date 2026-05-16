import React, {useEffect, useState} from 'react';
import {useCurrentEditor} from '@tiptap/react';

import {ColorPicker, error, Icon} from 'air-design';
import type {MenuProps} from 'antd';
import {Dropdown, Upload} from 'antd';
import type {UploadFile} from 'antd/es/upload/interface';

import TableSizePanel from './components/TableSizePanel';

import './EditorMenu.less';

import UndoIcon from './icons/tb_undo';
import RedoIcon from './icons/tb_redo';

import BoldIcon from './icons/tb_bold';
import ItalicIcon from './icons/tb_italic';
import UnderlineIcon from './icons/tb_underline';
import StrikeIcon from './icons/tb_strike';
import CodeLineIcon from './icons/tb_code_line';
import FormulaIcon from './icons/tb_formula';

import FontColorIcon from './icons/tb_font_color';
import BackgroundColorIcon from './icons/tb_bg_color';

import AlignLeftIcon from './icons/tb_align_left';
import AlignCenterIcon from './icons/tb_align_center';
import AlignRightIcon from './icons/tb_align_right';
import ListIcon from './icons/tb_list';
import ListNumIcon from './icons/tb_list_sort';
import IndentIcon from './icons/tb_indent';
import OutdentIcon from './icons/tb_outdent';

import CheckIcon from './icons/tb_check';
import LinkIcon from './icons/tb_link';
import ImageIcon from './icons/tb_image';
import TableIcon from './icons/tb_table';
import CodeBlockIcon from './icons/tb_code';
import QuoteIcon from './icons/tb_quote';
import HrIcon from './icons/tb_hr';

// 创建一个数组，保存所有标题样式
const stylesArray = [
  {label: '普通文本', value: '0'},
  {label: '标题一', value: '1'},
  {label: '标题二', value: '2'},
  {label: '标题三', value: '3'},
  {label: '标题四', value: '4'},
  {label: '标题五', value: '5'},
  {label: '标题六', value: '6'},
];

const EditorMenu = (props: any) => {

  const {
    showUndo = true,
    simpleMode = false,
    docId,
    width
  } = props;

  const {editor} = useCurrentEditor();
  const [textStyle, setTextStyle] = useState({label: '正文', value: '0'});
  const [showTablePanel, setShowTablePanel] = useState(false);

  useEffect(() => {
    if (!editor) return;
    const updateTextStyle = () => {
      // 检查当前激活的标题级别
      for (let i = 1; i <= 6; i++) {
        if (editor.isActive('heading', {level: i})) {
          const style = stylesArray.find(s => s.value === String(i));
          if (style) {
            setTextStyle({label: style.label, value: style.value});
            return;
          }
        }
      }
      // 如果没有匹配的标题，则设置为正文
      setTextStyle({label: '正文', value: '0'});
    };

    // 监听选择变化事件
    editor.on('selectionUpdate', updateTextStyle);
    editor.on('update', updateTextStyle);

    return () => {
      editor.off('selectionUpdate', updateTextStyle);
      editor.off('update', updateTextStyle);
    }
  }, [editor]);

  const textStyleItems: MenuProps['items'] = stylesArray.map(style => ({
    key: style.value,
    label: (
        <div style={{
          fontSize: style.value === '0' ? '1rem' : `${2 - Number(style.value) * 0.2}rem`,
          padding: '0.2rem 0.4rem',
          fontWeight: style.value === '0' ? 'normal' : 'bold'
        }}>
          {style.label}
        </div>
    ),
    onClick: () => handleSetTextStyle(style.value)
  }));

  const handleSetTextStyle = (value: string) => {
    //根据value获取label
    const label = stylesArray.find(style => style.value === value)?.label;
    if (label) {
      setTextStyle({label, value});
    } else {
      setTextStyle({label: '正文', value: '0'});
    }

    if (value === '0') {
      editor?.chain().focus().setParagraph().run();
    } else {
      editor?.chain().focus().setHeading({level: Number(value)} as any).run();
    }
  }

  const renderTextStyleDropdown = (menu: any) => {
    return <div style={{
      width: '180px',
      maxHeight: '320px',
      overflowY: 'auto'
    }}>{menu}</div>;
  }

  // 添加图片处理函数
  const handleImageUpload = async (file: UploadFile) => {
    try {

      const img = new Image();
      img.src = URL.createObjectURL(file as any);

      await new Promise((resolve) => {
        img.onload = () => {
          const maxWidth = 300;
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            const ratio = maxWidth / width;
            width = maxWidth;
            height = height * ratio;
          }

          // 写入数据库
          saveImageToDatabase(file, {width, height}, docId)
              .then(resp => {
                if (resp.success) {
                  const item = resp.data[0];
                  const blobUrl = item?.blobUrl;
                  const imageUrl = blobUrl || (item?.hashcode ? `http://localhost:8000/image/wiki/${item.hashcode}` : '');
                  if (imageUrl) {
                    editor?.chain().focus().insertContent(`<img src="${imageUrl}" style="width: ${width}px; height: ${height}px;" alt=''>`).run();
                  }
                }

                resolve(null);
              })
              .catch(err => {
                console.error('保存图片到数据库失败:', err);
                resolve(null); // 即使数据库操作失败，仍然继续流程
              });
        };
      });
    } catch (e) {
      error({
        title: '图片上传失败',
        message: '请检查网络连接或重新上传'
      });
    }
  };

  // 添加保存图片到数据库的函数
  const saveImageToDatabase = async (file: UploadFile, dimensions: {
    width: number,
    height: number
  }, docId?: string) => {
    const formData = new FormData();
    formData.append('files', file as any);
    formData.append('bucket', 'wiki');
    formData.append('ownerType', 'document');
    formData.append('ownerId', docId || '');
    formData.append('width', dimensions.width.toString());
    formData.append('height', dimensions.height.toString());

    // 发送请求保存图片信息到数据库
    const res = await fetch('/rest/file/upload', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + sessionStorage.getItem('air-machine-token'),
      },
      body: formData
    });

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.message || '保存图片失败');
    }

    return data;
  };


  return (
      <div className="air-editor-toolbar" style={{width: width + 15, overflowX: 'hidden'}}>
        {
            showUndo && (
                <>
                  {/* 撤销 */}
                  <div className="air-editor-toolbar-item">
                    <div className="air-editor-toolbar-item-button" onClick={() => {
                      editor?.chain().focus().undo().run();
                    }}>
                      <UndoIcon/>
                    </div>
                  </div>

                  {/* 重做 */}
                  <div className="air-editor-toolbar-item">
                    <div className="air-editor-toolbar-item-button" onClick={() => {
                      editor?.chain().focus().redo().run();
                    }}>
                      <RedoIcon/>
                    </div>
                  </div>

                  {/* 分隔栏 */}
                  <div className="air-editor-toolbar-separator"></div>
                </>
            )
        }

        {/* 格式选择 */}
        <div className="air-editor-toolbar-item">
          <Dropdown
              menu={{items: textStyleItems}}
              trigger={['click']}
              popupRender={renderTextStyleDropdown}
              destroyOnHidden={true}
              placement="bottomLeft"
              overlayClassName="air-editor-toolbar-dropdown-menu"
          >
            <div className="air-editor-toolbar-item-dropdown">
              {textStyle.label}
              <Icon name={'arrow_down'} size={14} thickness={3}/>
            </div>
          </Dropdown>
        </div>

        {/* 分隔栏 */}
        <div className="air-editor-toolbar-separator"></div>

        {/* 加粗 */}
        <div className="air-editor-toolbar-item">
          <div className={"air-editor-toolbar-item-button" + (editor?.isActive('bold') ? ' button-active' : '')}
               onClick={() => {
                 editor?.chain().focus().toggleBold().run();
               }}>
            <BoldIcon/>
          </div>
        </div>

        {/* 斜体 */}
        <div className="air-editor-toolbar-item">
          <div className={"air-editor-toolbar-item-button" + (editor?.isActive('italic') ? ' button-active' : '')}
               onClick={() => {
                 editor?.chain().focus().toggleItalic().run();
               }}>
            <ItalicIcon/>
          </div>
        </div>

        {/* 下划线 */}
        <div className="air-editor-toolbar-item">
          <div className={"air-editor-toolbar-item-button" + (editor?.isActive('underline') ? ' button-active' : '')}
               onClick={() => {
                 editor?.chain().focus().toggleUnderline().run();
               }}>
            <UnderlineIcon/>
          </div>
        </div>

        {/* 删除线 */}
        <div className="air-editor-toolbar-item">
          <div className={"air-editor-toolbar-item-button" + (editor?.isActive('strike') ? ' button-active' : '')}
               onClick={() => {
                 editor?.chain().focus().toggleStrike().run();
               }}>
            <StrikeIcon/>
          </div>
        </div>

        {/* 代码行 */}
        <div className="air-editor-toolbar-item">
          <div className={
              "air-editor-toolbar-item-button" +
              (editor?.isActive('code') ? ' button-active' : '')
          } onClick={() => {
            editor?.chain().focus().toggleCode().run();
          }}>
            <CodeLineIcon/>
          </div>
        </div>

        {/* 公式 */}
        <div className="air-editor-toolbar-item">
          <div className="air-editor-toolbar-item-button">
            <FormulaIcon/>
          </div>
        </div>

        {/* 分隔栏 */}
        <div className="air-editor-toolbar-separator"></div>

        {
            !simpleMode && (
                <>
                  {/* 字体颜色 */}
                  <div className="air-editor-toolbar-item">
                    <ColorPicker
                        trigger="click"
                        onChangeComplete={(color) => {
                          editor?.chain().focus().setColor(color.toHexString()).run();
                        }}
                    >
                      <div className={"air-editor-toolbar-item-button"}>
                        <FontColorIcon/>
                      </div>
                    </ColorPicker>
                  </div>

                  {/* 背景颜色 */}
                  <div className="air-editor-toolbar-item">
                    <ColorPicker
                        trigger="click"
                        onChangeComplete={(color) => {
                          editor?.chain().focus().setHighlight({color: color.toHexString()}).run();
                        }}
                    >
                      <div className="air-editor-toolbar-item-button">
                        <BackgroundColorIcon/>
                      </div>
                    </ColorPicker>
                  </div>

                  {/* 分隔栏 */}
                  <div className="air-editor-toolbar-separator"></div>
                </>
            )
        }

        {/* 文字对齐方式 */}
        <div className="air-editor-toolbar-item">
          <div className={
              "air-editor-toolbar-item-button" +
              (editor?.isActive({textAlign: 'left'}) ? ' button-active' : '')
          } onClick={() => {
            editor?.chain().focus().setTextAlign('left').run();
          }}>
            <AlignLeftIcon/>
          </div>
        </div>

        <div className="air-editor-toolbar-item">
          <div className={
              "air-editor-toolbar-item-button" +
              (editor?.isActive({textAlign: 'center'}) ? ' button-active' : '')
          } onClick={() => {
            editor?.chain().focus().setTextAlign('center').run();
          }}>
            <AlignCenterIcon/>
          </div>
        </div>

        <div className="air-editor-toolbar-item">
          <div className={
              "air-editor-toolbar-item-button" +
              (editor?.isActive({textAlign: 'right'}) ? ' button-active' : '')
          } onClick={() => {
            editor?.chain().focus().setTextAlign('right').run();
          }}>
            <AlignRightIcon/>
          </div>
        </div>

        <div className="air-editor-toolbar-separator"></div>

        {/* 列表 */}
        <div className="air-editor-toolbar-item">
          <div className={
              "air-editor-toolbar-item-button" +
              (editor?.isActive('bulletList') ? ' button-active' : '')
          } onClick={() => {
            editor?.chain().focus().toggleBulletList().run();
          }}>
            <ListIcon/>
          </div>
        </div>

        {/* 有序列表 */}
        <div className="air-editor-toolbar-item">
          <div className={
              "air-editor-toolbar-item-button" +
              (editor?.isActive('orderedList') ? ' button-active' : '')
          } onClick={() => {
            editor?.chain().focus().toggleOrderedList().run();
          }}>
            <ListNumIcon/>
          </div>
        </div>

        {/* 增加缩进 */}
        <div className="air-editor-toolbar-item">
          <div className="air-editor-toolbar-item-button" onClick={() => {
            editor?.chain().focus().setIndent().run();
          }}>
            <IndentIcon/>
          </div>
        </div>

        {/* 减少缩进 */}
        <div className="air-editor-toolbar-item">
          <div className="air-editor-toolbar-item-button" onClick={() => {
            editor?.chain().focus().removeIndent().run();
          }}>
            <OutdentIcon/>
          </div>
        </div>

        {/* 分隔栏 */}
        <div className="air-editor-toolbar-separator"></div>
        {
            !simpleMode && (
                <>
                  {/* 插入任务列表 */}
                  <div className="air-editor-toolbar-item">
                    <div
                        className={
                            "air-editor-toolbar-item-button" +
                            (editor?.isActive('taskList') ? ' button-active' : '')
                        }
                        onClick={() => {
                          editor?.chain().focus().toggleTaskList().run()
                        }}
                    >
                      <CheckIcon/>
                    </div>
                  </div>

                  {/* 插入链接 */}
                  <div className="air-editor-toolbar-item">
                    <div className="air-editor-toolbar-item-button">
                      <LinkIcon/>
                    </div>
                  </div>

                  {/* 插入图片 */}
                  <div className="air-editor-toolbar-item">
                    <Upload
                        accept="image/*"
                        showUploadList={false}
                        beforeUpload={(file) => {
                          handleImageUpload(file);
                          return false; // 阻止自动上传
                        }}
                    >
                      <div className="air-editor-toolbar-item-button">
                        <ImageIcon/>
                      </div>
                    </Upload>
                  </div>
                  {/* 插入表格 */}
                  <div className="air-editor-toolbar-item">
                    <Dropdown
                        open={showTablePanel}
                        onOpenChange={setShowTablePanel}
                        popupRender={() => (
                            <TableSizePanel
                                editor={editor}
                                onClose={() => setShowTablePanel(false)}
                            />
                        )}
                        placement="bottomLeft"
                        trigger={['click']}
                        destroyOnHidden={true}
                    >
                      <div className="air-editor-toolbar-item-button">
                        <TableIcon/>
                      </div>
                    </Dropdown>
                  </div>
                </>
            )
        }

        {/* 插入代码块 */}
        <div className="air-editor-toolbar-item">
          <div
              className={
                  "air-editor-toolbar-item-button" +
                  (editor?.isActive('codeBlock') ? ' button-active' : '')
              }
              onClick={() => {
                editor?.chain().focus().toggleCodeBlock().run();
              }}
          >
            <CodeBlockIcon/>
          </div>
        </div>

        {/* 插入引用 */}
        <div className="air-editor-toolbar-item">
          <div
              className={
                  "air-editor-toolbar-item-button" +
                  (editor?.isActive('blockquote') ? ' button-active' : '')
              }
              onClick={() => {
                editor?.chain().focus().toggleBlockquote().run();
              }}
          >
            <QuoteIcon/>
          </div>
        </div>

        {/* 插入分割线 */}
        <div className="air-editor-toolbar-item">
          <div
              className="air-editor-toolbar-item-button"
              onClick={() => {
                editor?.chain().focus().setHorizontalRule().run();
              }}
          >
            <HrIcon/>
          </div>
        </div>

      </div>
  );
};

export default EditorMenu;

