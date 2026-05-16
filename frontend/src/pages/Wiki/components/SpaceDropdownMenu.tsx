import React, {useEffect} from "react";
import {connect} from 'umi';
import {Dialog, error, Icon} from 'air-design';
import type {MenuProps} from 'antd';
import {Dropdown, Form} from 'antd';
import NewSpaceForm from "@/pages/Wiki/components/NewSpaceForm";

const SpaceDropdownMenu: React.FC<any> = props => {

  const {
    dispatch,
    wiki: {
      currentSpace,
      recentSpaces
    }
  } = props;

  useEffect(() => {
    // 获取当前空间信息
    dispatch({
      type: 'wiki/fetchRecentSpaces',
      payload: {},
      callback: spaces => {
        if (spaces.length === 0) {
          dispatch({
            type: 'wiki/setShowSpaces',
            payload: true
          });
        } else {
          const recent = spaces[0];
          if (recent && recent.id) {
            dispatch({
              type: 'wiki/setShowSpaces',
              payload: false
            });
          }
        }
      }
    });
  }, []);

  const [spaceForm] = Form.useForm();

  const handleCreateSpace = () => {
    spaceForm.resetFields();
    Dialog({
      title: '新建空间',
      content: <NewSpaceForm form={spaceForm}/>,
      onConfirm: dlg => {
        spaceForm.validateFields().then(values => {
          dispatch({
            type: 'wiki/updateSpace',
            payload: values,
            callback: resp => {
              if (resp.success) {
                dispatch({
                  type: 'wiki/addRecentSpace',
                  payload: {spaceId: resp.data.id},
                  callback: resp => {
                    if (resp.success) {
                      dispatch({
                        type: 'wiki/fetchRecentSpaces',
                        payload: {},
                      });
                    }
                  }
                });
                dlg.doCancel();
              } else {
                error({
                  title: '创建空间失败',
                  message: resp.message,
                });
              }
            }
          });
        });
      },
    });
  }

  // 当前空间
  const currentItem = (currentSpace && currentSpace.id) ? [
    {
      label: <div style={{fontSize: '0.75rem', color: '#999', fontWeight: 'bold'}}>当前</div>,
      key: 'current-space',
      disabled: true,
    },
    {
      label: currentSpace.name,
      key: `current-${currentSpace.id}`
    }
  ] : []

  // 最近访问空间（排除当前空间，取前5个）
  const recentSpacesList = recentSpaces
    .filter(space => space.id !== currentSpace?.id)
    .slice(0, 5);
  const recentItems = recentSpacesList.length > 0 ? [
    {
      label: <div style={{fontSize: '0.75rem', color: '#999', fontWeight: 'bold'}}>最近</div>,
      key: 'recent-space',
      disabled: true,
    },
    ...recentSpacesList.map(space => {
      return {
        label: space.name,
        key: space.id,
        onClick: () => {
          dispatch({
            type: 'wiki/addRecentSpace',
            payload: {spaceId: space.id},
            callback: resp => {
              if (resp.success) {
                dispatch({
                  type: 'wiki/fetchRecentSpaces',
                  payload: {},
                });
              }
            }
          });
        }
      }
    }),
    // 分隔符
    {
      type: 'divider',
      key: 'divider'
    }
  ] : []


  // 空间操作项
  const actionItems = [
    {
      label: '全部空间',
      key: 'manage-space',
      onClick: () => {
        dispatch({
          type: 'wiki/setShowSpaces',
          payload: true
        });
      }
    },
    {
      label: <div style={{minWidth: '160px'}}><b>新建 ...</b></div>,
      key: 'create-space',
      onClick: handleCreateSpace
    }
  ];

  const items: MenuProps['items'] = [
    ...currentItem,
    ...recentItems,
    ...actionItems
  ];

  return (
      <Dropdown menu={{items}} placement="bottomLeft" trigger={['click']} destroyOnHidden={true}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          height: '32px',
          marginLeft: '16px',
          cursor: 'pointer'
        }}>
          <Icon name={'note'} size={20}/>
          {
            currentSpace && currentSpace.id ? currentSpace.name : '[ 选择文档空间 ]'
          }
          <div style={{display: 'flex', alignItems: 'center', marginTop: '1px'}}>
            <Icon name={'arrow_down'} size={14} thickness={2}/>
          </div>
        </div>
      </Dropdown>
  );
}

export default connect(({wiki}) => ({
  wiki
}))(SpaceDropdownMenu);
