import React, {useState} from 'react';
import {connect} from 'umi';
import {PropertiesNaviBar} from 'air-design';
import AdminPaasNaviData from '../SettingsNaviData.json';
import './index.less';

import DatabaseSettingsPanel from './DatabaseSettingsPanel';
import RedisSettingsPanel from './RedisSettingsPanel';

const renderPanel = (key: string) => {
  switch (key) {
    case 'database': return <DatabaseSettingsPanel/>;
    case 'redis':    return <RedisSettingsPanel/>;
    default:         return <div>暂无内容</div>;
  }
};

/**
 * Admin 系统设置页面
 *
 * 单层左右布局：左侧导航 + 右侧配置面板。
 *
 * @author ChaiMingXu
 * @since 2026/5/26
 */
const SettingsPage: React.FC<any> = (props) => {
  const {frameSize} = props;
  const [activeKey, setActiveKey] = useState('database');

  return (
    <div className="air-admin-paas" style={{width: frameSize.width, height: frameSize.height}}>
      <PropertiesNaviBar
        width={220}
        height={frameSize.height}
        data={AdminPaasNaviData}
        activeKey={activeKey}
        onChange={setActiveKey}
      />
      <div className="air-admin-paas-content" style={{width: frameSize.width - 220, height: frameSize.height}}>
        <div className="air-admin-paas-panel">
          {renderPanel(activeKey)}
        </div>
      </div>
    </div>
  );
};

export default connect(({global}: any) => ({
  frameSize: global.frameSize,
}))(SettingsPage);
