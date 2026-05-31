/**
 * Wiki 主布局组件
 *
 * 集成安全布局逻辑，未登录时渲染 Login 页面，已登录后渲染 Wiki 内容。
 * AirNotes 使用扁平路由结构（无外层 SecurityLayout 包裹），
 * 因此认证检查逻辑直接内嵌于此组件。
 *
 * 已认证后的内容渲染：
 * - 顶部 HeadBar 导航栏
 * - admin 用户显示设置页面
 * - 非 admin 用户显示 Wiki 内容
 *
 * @author ChaiMingXu, 2026/05/27
 */
import React, { useEffect, useRef } from 'react';
import { connect } from 'umi';
import { ConfigProvider, Spin } from 'air-design';
import { Login, storageKey } from 'air-auth';
import '@/suppressWarnings';
import HeadBar from './HeadBar';
import Wiki from '@/pages/Wiki';
import SettingsPage from '@/pages/Admin/Settings';
import zhCN from 'antd/es/locale/zh_CN';

const WikiLayout: React.FC<any> = props => {
  const { dispatch, user, layoutSize, frameSize } = props;
  const { userSettings, userSettingsLoading } = user;
  const hasCheckedRef = useRef(false);
  const dispatchRef = useRef(dispatch);
  const isAdmin = user.currentUser?.id === 'admin';

  // 保持 dispatch 引用最新
  useEffect(() => {
    dispatchRef.current = dispatch;
  }, [dispatch]);

  // 初始检查认证状态：只在首次挂载时执行一次
  useEffect(() => {
    if (!hasCheckedRef.current) {
      hasCheckedRef.current = true;
      const token = sessionStorage.getItem(storageKey('token'));
      if (token) {
        dispatchRef.current({ type: 'user/validateToken' });
      }
    }
  }, []);

  // 监听认证状态变化事件（登录/登出）
  useEffect(() => {
    const handleAuthChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && !detail.authenticated) {
        dispatchRef.current({ type: 'user/clearUser' });
      }
    };
    window.addEventListener('auth-state-changed', handleAuthChange);
    return () => window.removeEventListener('auth-state-changed', handleAuthChange);
  }, []);

  // 监听 storage 变化（跨标签页同步 token）
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === storageKey('token')) {
        dispatchRef.current({ type: 'user/validateToken' });
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // 窗口尺寸变化
  useEffect(() => {
    const handleResize = () => {
      dispatch({ type: 'global/changeFrameSize' });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [dispatch]);

  // 非 admin 用户登录后加载用户设置
  useEffect(() => {
    if (user.currentUser?.id && user.currentUser.loginId !== 'admin') {
      dispatch({ type: 'user/fetchUserSettings', payload: { userId: user.currentUser.id } });
    }
  }, [user.currentUser?.id, dispatch]);

  // 应用用户字体大小设置
  useEffect(() => {
    if (userSettings && !userSettingsLoading && userSettings.settings) {
      try {
        const displaySettings = JSON.parse(userSettings.settings);
        const fontSize = displaySettings.fontSize || 16;
        document.documentElement.style.fontSize = `${fontSize}px`;
      } catch {
        document.documentElement.style.fontSize = '16px';
      }
    } else if (!userSettingsLoading) {
      document.documentElement.style.fontSize = '16px';
    }
  }, [userSettings, userSettingsLoading]);

  // 正在验证 token 时显示全屏加载
  if (user.validatingToken) {
    return <Spin spinning={true} fullscreen={true} description="正在验证身份..." />;
  }

  // 未认证则显示登录页
  if (!user.isAuthenticated) {
    return <Login />;
  }

  // 已认证则渲染 Wiki 内容
  return (
    <ConfigProvider
      prefixCls="air"
      locale={zhCN}
    >
      <HeadBar height={layoutSize.headerHeight} isAdmin={isAdmin} />
      <div style={{
        position: 'fixed',
        top: layoutSize.headerHeight,
        width: frameSize.width,
        height: frameSize.height
      }}>
        {isAdmin ? <SettingsPage /> : <Wiki />}
      </div>
    </ConfigProvider>
  );
};

export default connect(({ user, global }: any) => ({
  user,
  layoutSize: global.layoutSize,
  frameSize: global.frameSize,
  userSettings: user.userSettings,
  userSettingsLoading: user.userSettingsLoading,
}))(WikiLayout);
