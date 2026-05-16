import React from "react";
import {connect} from 'umi';
import {EditableLabel, Message} from 'air-design';

interface SpaceInfoProps {
}

const SpaceInfo: React.FC<SpaceInfoProps | any> = props => {

  const {
    dispatch,
    wiki: {
      currentSpace
    }
  } = props;

  /**
   * 保存空间名称
   * @param newName 新的空间名称
   */
  const handleSaveSpaceName = (newName: string) => {
    if (!currentSpace?.id) {
      Message.error('空间信息不完整');
      return;
    }

    if (!newName || !newName.trim()) {
      Message.error('空间名称不能为空');
      return;
    }

    dispatch({
      type: 'wiki/updateSpace',
      payload: {
        id: currentSpace.id,
        name: newName.trim()
      },
      callback: (resp: any) => {
        if (resp.success) {
          Message.success('空间名称已更新');
        } else {
          Message.error(resp.message || '更新空间名称失败');
        }
      }
    });
  };

  return (
      <div>
        <div style={{padding: '30px'}}>
          <EditableLabel
              text={currentSpace?.name || ''}
              onSave={handleSaveSpaceName}
              style={{fontSize: '24px', fontWeight: 'bold'}}
          />
        </div>
      </div>
  );
}

export default connect(({wiki}) => ({
  wiki
}))(SpaceInfo);
