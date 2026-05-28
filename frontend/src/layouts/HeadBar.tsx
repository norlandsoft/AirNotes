/**
 * 顶部导航栏组件
 *
 * 参考 AirMachine 的 header 布局结构，采用左右分区设计：
 * - 左侧：AppSwitcher 应用切换器 + 应用 logo + 空间下拉菜单（或管理标签）
 * - 右侧：全屏切换 + 用户头像
 *
 * 点击头像弹出用户面板（SlidePanel），支持修改密码和退出登录。
 *
 * Created by ChaiMingXu, on 2026/05/27
 */
import React, {useEffect, useState} from 'react';
import {connect} from 'umi';
import {Avatar} from 'air-design';
import {Dialog, Icon, SlidePanel} from 'air-design';
import screenfull from 'screenfull';
import {SHA, AppSwitcher, UserSettings} from 'air-auth';
import {getAvatarUrl} from '@/utils/UserUtils';
import SpaceDropdownMenu from '@/pages/Wiki/components/SpaceDropdownMenu';
import './HeadBar.less';

const HeadBar: React.FC<any> = props => {
  const {dispatch, currentUser, height, isAdmin} = props;

  const [fullScreen, setFullScreen] = useState(false);
  const [showUserPanel, setShowUserPanel] = useState(false);
  const [showPasswordPanel, setShowPasswordPanel] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // 修改密码
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    const handleResize = () => setFullScreen(screenfull.isFullscreen);
    window.addEventListener('resize', handleResize);
    setFullScreen(screenfull.isFullscreen);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleFullScreen = () => {
    if (screenfull.isEnabled) {
      screenfull.toggle();
    }
  };

  const handleLogout = () => {
    Dialog({
      title: '退出',
      message: '是否退出登录？',
      onConfirm: dlg => {
        dispatch({type: 'user/logout'});
        dlg.doCancel();
      }
    });
  };

  const handleChangePassword = () => {
    setPasswordError('');
    if (!oldPassword || !newPassword) {
      setPasswordError('请填写完整');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('两次密码不一致');
      return;
    }
    if (newPassword.length < 4) {
      setPasswordError('密码长度不能少于4位');
      return;
    }
    dispatch({
      type: 'user/changeAdminPassword',
      payload: {
        oldPassword: SHA(oldPassword),
        newPassword: SHA(newPassword)
      },
      callback: (resp: any) => {
        if (resp.success) {
          setShowPasswordPanel(false);
        } else {
          setPasswordError(resp.message);
        }
      }
    });
  };

  const inputStyle = {width: '100%', padding: '8px', border: '1px solid #d9d9d9', borderRadius: '4px'};

  return (
      <div className="air-layout-head" style={{height}}>
        {/* 左侧：应用切换 + logo + 空间菜单 */}
        <div className="air-layout-head-content">
          <div className="air-layout-head-content-app">
            <AppSwitcher/>
            <div className="air-layout-head-content-app-title"
                 style={{backgroundImage: `url(/icons/logo/default.svg)`}}/>
          </div>
          <div className="air-layout-head-content-project">
            {isAdmin
                ? <span style={{fontSize: '0.9rem', color: 'var(--text-secondary)'}}>平台管理</span>
                : <SpaceDropdownMenu/>
            }
          </div>
        </div>

        {/* 右侧：全屏 + 头像 */}
        <div className="air-layout-head-right">
          <div className="air-layout-head-right-function">
            <div className="air-layout-head-right-function-inner" onClick={handleFullScreen}>
              <Icon name={fullScreen ? 'full_screen_exit' : 'full_screen'} thickness={2} size={20}/>
            </div>
          </div>
          <div className="air-layout-head-right-avatar" onClick={() => setShowUserPanel(true)}>
            <Avatar
                size={28}
                src={getAvatarUrl(currentUser?.avatar)}
                alt={currentUser?.name || currentUser?.id}
            >
              {currentUser?.name?.charAt(0) || currentUser?.id?.charAt(0) || 'U'}
            </Avatar>
          </div>
        </div>

        {/* 用户面板 */}
        <SlidePanel
            type="small"
            open={showUserPanel}
            maskClosable={true}
            hasButtonBar={false}
            bodyPadding={0}
            onClose={() => setShowUserPanel(false)}
        >
          <div className="air-frame-user-panel">
            <div className="air-frame-user-panel-info">
              <Avatar size={64} className="air-frame-user-panel-info-avatar"
                      src={getAvatarUrl(currentUser?.avatar)}/>
              <div className="air-frame-user-panel-info-name">{currentUser?.name || currentUser?.id}</div>
              <div className="air-frame-user-panel-info-id">#{currentUser?.loginId || currentUser?.id}</div>
              <div className="air-frame-user-panel-info-close" onClick={() => setShowUserPanel(false)}>
                <Icon name="close" size={14}/>
              </div>
            </div>
            <div className="air-frame-user-panel-ops" onClick={() => setShowUserPanel(false)}>
              {currentUser?.loginId === 'admin' ? (
                /* admin 用户 - 显示修改密码 */
                <div className="air-frame-user-panel-ops-item" onClick={() => setShowPasswordPanel(true)}>
                  <Icon name="key" size={20}/>
                  <div className="air-frame-user-panel-ops-item-text">修改密码</div>
                </div>
              ) : (
                /* 非 admin 用户 - 显示用户设置 */
                <div className="air-frame-user-panel-ops-item" onClick={() => setShowSettings(true)}>
                  <Icon name="settings" size={20}/>
                  <div className="air-frame-user-panel-ops-item-text">用户设置</div>
                </div>
              )}
              <div className="air-frame-user-panel-ops-hr"/>
              <div className="air-frame-user-panel-ops-item" onClick={handleLogout}>
                <Icon name="exit" size={20}/>
                <div className="air-frame-user-panel-ops-item-text">退出登录</div>
              </div>
            </div>
          </div>
        </SlidePanel>

        {/* 修改密码面板 */}
        <SlidePanel
            type="medium"
            title="修改密码"
            open={showPasswordPanel}
            onClose={() => setShowPasswordPanel(false)}
            hasCloseButton={true}
            confirmButtonText="保存"
            closeButtonText="关闭"
            onConfirm={handleChangePassword}
        >
          <div style={{padding: '16px'}}>
            <div style={{marginBottom: '8px'}}>
              <input type="password" placeholder="旧密码" value={oldPassword}
                     onChange={e => setOldPassword(e.target.value)} style={inputStyle}/>
            </div>
            <div style={{marginBottom: '8px'}}>
              <input type="password" placeholder="新密码" value={newPassword}
                     onChange={e => setNewPassword(e.target.value)} style={inputStyle}/>
            </div>
            <div style={{marginBottom: '8px'}}>
              <input type="password" placeholder="确认新密码" value={confirmPassword}
                     onChange={e => setConfirmPassword(e.target.value)} style={inputStyle}/>
            </div>
            {passwordError && <div style={{color: '#ff4d4f', fontSize: '14px'}}>{passwordError}</div>}
          </div>
        </SlidePanel>

        {/* 非 admin 用户的设置面板 */}
        <UserSettings visible={showSettings} onClose={() => setShowSettings(false)} />
      </div>
  );
};

export default connect(({user, global}: any) => ({
  currentUser: user.currentUser,
  layoutSize: global.layoutSize,
}))(HeadBar);
