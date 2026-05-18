import React, {useEffect} from "react";
import {connect} from 'umi';
import {Dialog, Icon, Splitter, Tree, Notice} from 'air-design';
import {Form, Input} from 'air-design';

import SpaceList from './space/SpaceList';
import WorkContent from './WorkContent';
import './index.less';

const parentStyle = {
  height: '36px',
  lineHeight: '36px',
  paddingLeft: '10px',
  border: '1px solid #ccc',
  borderRadius: '3px',
  fontSize: '0.95rem',
  // 禁止换行
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'}

const Wiki: React.FC<any> = props => {

  const {
    dispatch,
    frameSize,
    wiki: {
      currentSpace,
      currentDocument,
      currentDocumentMenu,
      showSpaces
    }
  } = props;

  const [menuWidth, setMenuWidth] = React.useState(320);
  const [lastSelectedItemId, setLastSelectedItemId] = React.useState<string>('000000');

  const [newDocForm] = Form.useForm();
  const [renameDocForm] = Form.useForm();

  useEffect(() => {
    handleGetDocMenu();

    return () => {
      dispatch({
        type: 'wiki/saveCurrentDocumentMenu',
        payload: []
      });
    }
  }, [currentSpace?.id]);

  useEffect(() => {
    // 当从面包屑切换页面时，设置选中项
    if (currentDocument?.id) {
      setLastSelectedItemId(currentDocument.id);
    }

    return () => {
      setLastSelectedItemId('');
    }
  }, [currentDocument]);

  const handleGetDocMenu = () => {
    // 获取当前空间的文档目录
    dispatch({
      type: 'wiki/fetchDocMenu',
      payload: {
        space: currentSpace?.id
      }
    });
  }

  // 新建文档对话框，包含表单
  const handleNewDocDialog = (data: any, type: string) => {
    newDocForm.resetFields();
    const title = type === 'doc' ? '新建页面' : type === 'board' ? '新建白板' : '新建思维导图';
    Dialog({
      title,
      content: (
          <Form form={newDocForm}>
            {
                data && data.label && (
                    <>
                      <Form.Item
                          name={'parentId'}
                          initialValue={data?.key}
                          hidden={true}
                      >
                        <Input/>
                      </Form.Item>
                      <Form.Item
                          label={'父级'}
                      >
                        <div style={parentStyle}>{data?.label}</div>
                      </Form.Item>
                    </>
                )
            }
            <Form.Item
                label={'名称'}
                name={'title'}
            >
              <Input/>
            </Form.Item>
          </Form>
      ),
      onConfirm: dlg => {
        newDocForm.validateFields().then(values => {
          if (values.title && values.title.trim().length > 0) {
            const newValue = {
              ...values,
              parentId: values.parentId || '000000',
              space: currentSpace.id,
              format: type
            };
            // 提交数据
            dispatch({
              type: 'wiki/updateDoc',
              payload: newValue,
              callback: resp => {
                if (resp.success) {
                  handleGetDocMenu();

                  // close
                  dlg.doCancel();
                } else {
                  Notice.error('', resp.message);
                }
              }
            });
          } else {
            Notice.error('', '请输入合法名称');
          }
        });
      }
    });
  }

  const handleDocItemClick = (item: any) => {
    if (lastSelectedItemId === item.key) {
      return;
    }

    setLastSelectedItemId(item.key);

    dispatch({
      type: 'wiki/setCurrentDoc',
      payload: {
        id: item.key,
        name: item.label,
        format: item.data
      }});
  }

  const handleRenameDoc = (data: any) => {
    renameDocForm.resetFields();
    Dialog({
      title: '重命名文档',
      content: (
          <Form form={renameDocForm}>
            <Form.Item
                name={'id'}
                initialValue={data.key}
                hidden={true}
            >
              <Input/>
            </Form.Item>
            <Form.Item
                label={'名称'}
                name={'title'}
                initialValue={data.label}
            >
              <Input/>
            </Form.Item>
          </Form>
      ),
      onConfirm: dlg => {
        renameDocForm.validateFields().then(values => {
          dispatch({
            type: 'wiki/updateDoc',
            payload: {
              id: values.id,
              title: values.title
            },
            callback: resp => {
              if (resp.success) {
                handleGetDocMenu();
                dlg.doCancel();
              } else {
                Notice.error('错误', resp.message);
              }
            }
          });
        });
      }
    });
  }

  const handleRemoveDoc = (data: any) => {
    Dialog({
      title: '删除文档',
      content: `删除文档 [${data.label}]，该操作将无法恢复，是否继续？`,
      onConfirm: dlg => {
        dispatch({
          type: 'wiki/removeDoc',
          payload: {
            id: data.key},
          callback: resp => {
            if (resp.success) {
              handleGetDocMenu();
              dlg.doCancel();
              dispatch({
                type: 'wiki/setCurrentDoc',
                payload: {}});
            } else {
              Notice.error('错误', resp.message);
            }
          }
        });
      }
    });
  }

  const itemMenu = [
    {
      key: 'new-sub-doc',
      label: '新建页面'
    },
    {
      key: 'new-sub-board',
      label: '新建白板'
    },
    {
      key: 'new-sub-mind',
      label: '新建思维导图'
    },
    {
      key: 'divider-1',
      type: 'divider'
    },
    {
      key: 'new-sub-file',
      label: '导入文件'
    },
    {
      key: 'divider-2',
      type: 'divider'
    },
    {
      key: 'rename-doc',
      label: '重命名'
    },
    {
      key: 'remove-doc',
      label: '删除'
    }
  ]

  const handleMenuItemClick = (item: any, data: any) => {
    if (item.key === 'new-sub-doc') {
      handleNewDocDialog(data, 'doc');
    }
    if (item.key === 'new-sub-board') {
      handleNewDocDialog(data, 'board');
    }
    if (item.key === 'new-sub-mind') {
      handleNewDocDialog(data, 'mind');
    }
    if (item.key === 'new-sub-file') {
    }
    if (item.key === 'rename-doc') {
      handleRenameDoc(data);
    }
    if (item.key === 'remove-doc') {
      handleRemoveDoc(data);
    }
  }

  const handleDocItemDrop = (info: any) => {
    const {dropToGap, node, dragNode} = info;
    if (dropToGap) {
      // 上级为node的父级
      if (node.parent === dragNode.parent) {
        return;
      }
      const parentId = node.parent;
      dispatch({
        type: 'wiki/updateDoc',
        payload: {
          id: dragNode.key,
          parentId
        },
        callback: resp => {
          if (resp.success) {
            handleGetDocMenu();
          } else {
            Notice.error('', resp.message);
          }
        }
      });
    } else {
      // 上级为node
      const parentId = node.key;
      dispatch({
        type: 'wiki/updateDoc',
        payload: {
          id: dragNode.key,
          parentId
        },
        callback: resp => {
          if (resp.success) {
            handleGetDocMenu();
          } else {
            Notice.error('', resp.message);
          }
        }
      });
    }
  }

  const handleSplitterChange = (size: number) => {
    setMenuWidth(size);
  }

  return (
      showSpaces ? <SpaceList/> : (
          <>
            <Splitter
                split="vertical"
                primary="first"
                defaultSize={320}
                minSize={180}
                maxSize={500}
                style={{width: frameSize.width, height: frameSize.height}}
                className="air-wiki-frame-container"
                onChange={handleSplitterChange}
                collapsible={true}
            >
              {/*空间框架左侧，导航*/}
              <div style={{height: frameSize.height}} className="air-wiki-frame-nav">
                <div className="air-wiki-frame-space-name">
                  <div className="air-wiki-frame-space-name-inner" onClick={() => {
                    dispatch({
                      type: 'wiki/setCurrentDoc',
                      payload: {
                        id: '000000',
                        name: '空间首页'
                      }
                    });
                  }}>
                    <Icon name={'note'} size={20}/>
                    {currentSpace.name}
                  </div>
                </div>
                {/*空间内文档结构*/}
                <Tree
                    data={currentDocumentMenu}
                    height={frameSize.height - 50}
                    showFilter={true}
                    clickToCollapse={false}
                    groupMenu={itemMenu}
                    onSelect={handleDocItemClick}
                    menuItemClick={handleMenuItemClick}
                    rootButtonClick={() => handleNewDocDialog(null, 'doc')}
                    value={currentDocument?.id}
                    draggable={true}
                    onDrop={handleDocItemDrop}
                />
              </div>

              {/*空间框架右侧，文档编辑区*/}
              <div className="air-wiki-frame-content" style={{height: frameSize.height}}>
                <WorkContent width={frameSize.width - menuWidth - 1} height={frameSize.height}/>
              </div>
            </Splitter>
          </>
      )
  );
}

export default connect(({global, wiki}) => ({
  frameSize: global.frameSize,
  wiki
}))(Wiki);
