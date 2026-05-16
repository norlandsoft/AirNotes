import React, {useEffect, useState} from 'react';
import {connect} from 'umi';
import {Avatar} from 'antd';
import {Dialog, Icon, SlidePanel} from 'air-design';
import screenfull from 'screenfull';
import {SHA256} from 'crypto-js';
import SpaceDropdownMenu from '@/pages/Wiki/components/SpaceDropdownMenu';
import './HeadBar.less';

const HeadBar: React.FC<any> = props => {
  const {dispatch, currentUser, height} = props;

  const [fullScreen, setFullScreen] = useState(false);
  const [showUserPanel, setShowUserPanel] = useState(false);
  const [showPasswordPanel, setShowPasswordPanel] = useState(false);

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

  return (
    <div className="air-layout-head" style={{height, width: window.innerWidth}}>
      <div className="air-layout-head-content">
        <div className="air-layout-head-title">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8.75 3.5V2C8.75 1.59 8.41 1.25 8 1.25C7.59 1.25 7.25 1.59 7.25 2V3.56C7.5 3.53 7.73 3.5 8 3.5H8.75Z" fill="currentColor"/>
            <path d="M16.75 3.56V2C16.75 1.59 16.41 1.25 16 1.25C15.59 1.25 15.25 1.59 15.25 2V3.5H16C16.27 3.5 16.5 3.53 16.75 3.56Z" fill="currentColor"/>
            <path d="M16.75 3.56V5C16.75 5.41 16.41 5.75 16 5.75C15.59 5.75 15.25 5.41 15.25 5V3.5H8.75V5C8.75 5.41 8.41 5.75 8 5.75C7.59 5.75 7.25 5.41 7.25 5V3.56C4.3 3.83 3 5.73 3 8.5V17C3 20 4.5 22 8 22H16C19.5 22 21 20 21 17V8.5C21 5.73 19.7 3.83 16.75 3.56ZM12 16.75H8C7.59 16.75 7.25 16.41 7.25 16C7.25 15.59 7.59 15.25 8 15.25H12C12.41 15.25 12.75 15.59 12.75 16C12.75 16.41 12.41 16.75 12 16.75ZM16 11.75H8C7.59 11.75 7.25 11.41 7.25 11C7.25 10.59 7.59 10.25 8 10.25H16C16.41 10.25 16.75 10.59 16.75 11C16.75 11.41 16.41 11.75 16 11.75Z" fill="currentColor"/>
          </svg>
          <span>AirNotes</span>
        </div>
        <SpaceDropdownMenu/>
      </div>

      <div className="air-layout-head-right">
        <div className="air-layout-head-right-function">
          <div className="air-layout-head-right-function-inner" onClick={handleFullScreen}>
            <Icon name={fullScreen ? 'full_screen_exit' : 'full_screen'} thickness={2} size={20}/>
          </div>
        </div>
        <div className="air-layout-head-right-avatar" onClick={() => setShowUserPanel(true)}>
          <Avatar size={28}>
            {currentUser?.name?.charAt(0) || 'U'}
          </Avatar>
        </div>
      </div>

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
            <Avatar size={64} className="air-frame-user-panel-info-avatar">
              {currentUser?.name?.charAt(0) || 'U'}
            </Avatar>
            <div className="air-frame-user-panel-info-name">{currentUser?.name || currentUser?.id}</div>
            <div className="air-frame-user-panel-info-id">#{currentUser?.id}</div>
            <div className="air-frame-user-panel-info-close" onClick={() => setShowUserPanel(false)}>
              <Icon name="close" size={14}/>
            </div>
          </div>
          <div className="air-frame-user-panel-ops" onClick={() => setShowUserPanel(false)}>
            <div className="air-frame-user-panel-ops-item" onClick={() => setShowPasswordPanel(true)}>
              <Icon name="key" size={20}/>
              <div className="air-frame-user-panel-ops-item-text">修改密码</div>
            </div>
            <div className="air-frame-user-panel-ops-hr"/>
            <div className="air-frame-user-panel-ops-item" onClick={handleLogout}>
              <Icon name="exit" size={20}/>
              <div className="air-frame-user-panel-ops-item-text">退出登录</div>
            </div>
          </div>
        </div>
      </SlidePanel>

      <SlidePanel
        type="medium"
        title="修改密码"
        open={showPasswordPanel}
        onClose={() => setShowPasswordPanel(false)}
        hasCloseButton={true}
        confirmButtonText="保存"
        closeButtonText="关闭"
        onConfirm={async () => {
          const form = document.querySelector('.password-form') as any;
          if (form) form.requestSubmit();
        }}
      >
        <ChangePasswordForm
          userId={currentUser?.id}
          dispatch={dispatch}
          onSuccess={() => setShowPasswordPanel(false)}
        />
      </SlidePanel>
    </div>
  );
};

const ChangePasswordForm: React.FC<any> = ({userId, dispatch, onSuccess}) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    setError('');
    if (!oldPassword || !newPassword) {
      setError('请填写完整');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('两次密码不一致');
      return;
    }
    if (newPassword.length < 4) {
      setError('密码长度不能少于4位');
      return;
    }

    dispatch({
      type: 'user/changePassword',
      payload: {
        oldPassword: SHA256(oldPassword).toString(),
        newPassword: SHA256(newPassword).toString()
      },
      callback: (resp: any) => {
        if (resp.success) {
          onSuccess();
        } else {
          setError(resp.message);
        }
      }
    });
  };

  return (
    <div style={{padding: '16px'}}>
      <div style={{marginBottom: '12px'}}>
        <div style={{marginBottom: '8px'}}>
          <input type="password" placeholder="旧密码" value={oldPassword}
                 onChange={e => setOldPassword(e.target.value)}
                 style={{width: '100%', padding: '8px', border: '1px solid #d9d9d9', borderRadius: '4px'}}/>
        </div>
        <div style={{marginBottom: '8px'}}>
          <input type="password" placeholder="新密码" value={newPassword}
                 onChange={e => setNewPassword(e.target.value)}
                 style={{width: '100%', padding: '8px', border: '1px solid #d9d9d9', borderRadius: '4px'}}/>
        </div>
        <div style={{marginBottom: '8px'}}>
          <input type="password" placeholder="确认新密码" value={confirmPassword}
                 onChange={e => setConfirmPassword(e.target.value)}
                 style={{width: '100%', padding: '8px', border: '1px solid #d9d9d9', borderRadius: '4px'}}/>
        </div>
        {error && <div style={{color: '#ff4d4f', fontSize: '14px'}}>{error}</div>}
      </div>
      <button className="password-form" style={{display: 'none'}} onClick={handleSubmit}/>
    </div>
  );
};

export default connect(({user}) => ({
  currentUser: user.currentUser
}))(HeadBar);
