import React, {useEffect, useRef, useState} from "react";
import {connect} from "umi";
import {Icon, IconButton, success, warn} from 'air-design';
import {AntdSpin as Spin} from 'air-design';
import {RichEditor} from 'air-design';
import {Breadcrumb} from "@douyinfe/semi-ui";
import {findImageNodes} from "../components/DocImage";
import './DocumentEditor.less';

const DocumentEditor: React.FC<any> = props => {
  const {
    dispatch,
    width,
    height,
    wiki: {
      currentSpace,
      currentDocument
    },
    docInfoLoading
  } = props;

  const editorRef = useRef<any>(null);
  const [currentBreadCrumbs, setCurrentBreadCrumbs] = useState<any>([]);
  const [editable, setEditable] = useState<boolean>(false);

  useEffect(() => {
    // 获取文档内容，文档切换时重新获取
    getDocInfo();

    return () => {
      setEditable(false);
      editorRef.current?.setEditable(false);
    }
  }, [currentDocument]);

  useEffect(() => {
    editorRef.current?.setEditable(editable);
  }, [editable]);

  const getDocInfo = () => {
    dispatch({
      type: 'wiki/fetchDocInfo',
      payload: {
        id: currentDocument?.id
      },
      callback: (data: any) => {
        if (data) {
          const newBreadcrumbs = [
            ...data.breadCrumb,
            {
              key: data.id,
              label: data.title,
            }
          ]
          setCurrentBreadCrumbs(newBreadcrumbs);

          // 设置编辑器内容
          data.content = JSON.parse(data.content);
          editorRef.current?.setContent({
            content: data.content,
            title: data.title,
            format: data.format,
            type: 'doc'
          });

          editorRef.current?.setEditable(false);
        }
      }
    });
  }

  const handleSaveContent = () => {
    const content = editorRef.current.getContent();
    const title = content.title;
    if (title === '') {
      warn({
        title: '提示',
        message: '请输入标题',
      });
      return;
    }

    // 获取所有图片节点
    const imageNodes = findImageNodes(content.content);

    // 恢复图片链接
    imageNodes.forEach((item: any) => {
      if (item.type === 'image' && item.attrs.alt && item.attrs.alt !== '') {
        item.attrs.src = item.attrs.alt;
        item.attrs.alt = '';
      }
    });

    const docContent = JSON.stringify(content.content);
    if (content) {
      dispatch({
        type: 'wiki/updateDoc',
        payload: {
          id: currentDocument.id,
          title: content.title,
          content: docContent,
          format: content.format
        },
        callback: resp => {
          if (resp.success) {
            success({
              title: '提示',
              message: '保存成功',
            });

            getDocInfo();

            // 刷新
            dispatch({
              type: 'wiki/fetchDocMenu',
              payload: {
                space: currentSpace?.id,
              }
            });
          } else {
            warn({
              title: '提示',
              message: '保存失败',
            });
          }
        }
      });
    }
    // 设置编辑状态
    setEditable(false);
  }

  const handleEditContent = () => {
    setEditable(true);
  }

  const handleGoBack = () => {
    getDocInfo();
    setEditable(false);
  }

  const handleChangePage = (page: string) => {
    if (page == '000000') {
      dispatch({
        type: 'wiki/setCurrentDoc',
        payload: {
          id: page,
        }
      });

      return;
    }

    dispatch({
      type: 'wiki/fetchDocInfo',
      payload: {
        id: page
      },
      callback: resp => {
        dispatch({
          type: 'wiki/setCurrentDoc',
          payload: {
            id: page,
            name: resp.title,
            format: resp.format
          }
        })
      }
    });
  }

  return (
      <div className="air-wiki-document-editor">
        <div className="air-wiki-document-editor-top" style={{width: width}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '1rem'}}>
            <Icon name='note' size={18}/>
            {/* 面包屑 */}
            <Breadcrumb className="air-wiki-document-editor-breadcrumb" compact={false}>
              <Breadcrumb.Item key={'000000'}
                               onClick={() => handleChangePage('000000')}>{currentSpace.name}</Breadcrumb.Item>
              {
                  currentBreadCrumbs && currentBreadCrumbs.map((item: any) => (
                      <Breadcrumb.Item key={item.key}
                                       onClick={() => handleChangePage(item.key)}>{item.label}</Breadcrumb.Item>
                  ))
              }
            </Breadcrumb>
          </div>
          <div style={{marginRight: '1rem'}}>
            {
              editable ? (
                  <div style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                    <IconButton icon={'save'} onClick={handleSaveContent} size={32}/>
                    <IconButton icon={'back'} onClick={handleGoBack} size={32}/>
                  </div>
              ) : (
                  <div style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                    <IconButton icon={'edit'} onClick={handleEditContent} size={32}/>
                    <IconButton icon={'more'} size={32}/>
                  </div>
              )
            }
          </div>
        </div>
        <div className={'air-wiki-document-editor-content'}>
          <Spin spinning={docInfoLoading}>
            <RichEditor
                ref={editorRef}
                docId={currentDocument.id}
                showUndo={true}
                padding={0}
                height={height - 61}
                width={width}
                contentPadding={24}
                bordered={false}
                simpleMode={false}
                fixedHeight={editable}
            />
          </Spin>
        </div>
      </div>
  );
}

export default connect(({wiki, loading}) => ({
  wiki,
  docInfoLoading: loading.effects['wiki/fetchDocInfo']
}))(DocumentEditor);
