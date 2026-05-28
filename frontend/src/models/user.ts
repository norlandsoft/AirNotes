/**
 * 用户 DVA Model
 *
 * 管理用户认证状态，包括登录、登出、token 验证、修改密码等操作。
 * admin 用户走 /admin/user/login，其余用户走 /api/v1/auth/login。
 * validateToken 统一走 /api/v1/auth/current。
 *
 * 通过 air-auth SDK 的 storageKey() 和 SHA() 工具函数，
 * 确保存储键和加密方式与其他应用保持一致。
 *
 * 注意：必须为扁平对象导出（UmiJS dva 插件通过静态分析注册 model）
 *
 * @author ChaiMingXu, 2026/05/27
 */
import '../auth.config';
import { SHA, storageKey } from 'air-auth';
import { POST } from '@/utils/HttpRequest';
import { Notice } from 'air-design';

export default {
  namespace: 'user',

  state: {
    currentUser: null as any,
    isAuthenticated: !!sessionStorage.getItem(storageKey('token')),
    loading: false,
    validatingToken: false,
    userSettings: null as any,
    userSettingsLoading: false,
  },

  effects: {
    /**
     * 用户登录
     *
     * admin 用户走 /admin/user/login，其余走 /api/v1/auth/login。
     * 密码通过 SHA() 进行哈希加密后传输。
     */
    * login({ payload }: any, { call, put }: any) {
      const { id, password } = payload;
      const newPassword = SHA(password);
      const loginDTO = { id, password: newPassword };

      const isAdmin = id?.toLowerCase?.() === 'admin';
      const loginUrl = isAdmin ? '/admin/user/login' : '/api/v1/auth/login';
      const resp = yield POST(loginUrl, loginDTO);

      if (resp?.success) {
        const data = resp.data || {};
        const token = data.token || '';
        const user = data.user || data || null;

        if (token) sessionStorage.setItem(storageKey('token'), token);
        if (user?.id) sessionStorage.setItem(storageKey('uid'), String(user.id));
        if (user?.loginId) sessionStorage.setItem(storageKey('user'), String(user.loginId));

        yield put({ type: 'setUser', payload: user });
        window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: { authenticated: true } }));
      } else {
        Notice.error('登录失败', resp?.message || '登录失败，请检查用户名和密码');
      }
    },

    /**
     * 用户登出
     *
     * 清除 sessionStorage 中所有数据，重置用户状态。
     */
    * logout(_: any, { put }: any) {
      sessionStorage.clear();
      yield put({ type: 'clearUser' });
      window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: { authenticated: false } }));
    },

    /**
     * 验证 token 有效性
     *
     * 通过 /api/v1/auth/current 接口验证当前 token 是否有效，
     * 防止重复验证（通过 validatingToken 标志位控制）。
     */
    * validateToken(_: any, { call, put, select }: any) {
      const currentState = yield select((state: any) => state.user);
      if (currentState.validatingToken) return;

      const token = sessionStorage.getItem(storageKey('token'));
      if (!token) {
        if (currentState.isAuthenticated) {
          yield put({ type: 'clearUser' });
          window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: { authenticated: false } }));
        }
        return;
      }

      yield put({ type: 'setValidatingToken', payload: true });

      try {
        const resp = yield call(POST, '/api/v1/auth/current', {});
        if (resp?.success) {
          const user = resp.data || null;
          if (user?.id) sessionStorage.setItem(storageKey('uid'), String(user.id));
          if (user?.loginId) sessionStorage.setItem(storageKey('user'), String(user.loginId));

          const wasAuthenticated = currentState.isAuthenticated;
          const userChanged = !currentState.currentUser ||
              !currentState.currentUser.id ||
              currentState.currentUser.id !== user.id;

          yield put({ type: 'setUser', payload: user });
          if (userChanged || !wasAuthenticated) {
            window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: { authenticated: true } }));
          }
        } else {
          sessionStorage.removeItem(storageKey('token'));
          sessionStorage.removeItem(storageKey('user'));
          sessionStorage.removeItem(storageKey('uid'));
          if (currentState.isAuthenticated) {
            yield put({ type: 'clearUser' });
            window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: { authenticated: false } }));
          }
        }
      } finally {
        yield put({ type: 'setValidatingToken', payload: false });
      }
    },

    /**
     * 修改 admin 密码
     *
     * 对密码进行 SHA 哈希后通过 /admin/user/changePassword 接口提交。
     */
    * changeAdminPassword({ payload, callback }: any, { call }: any) {
      const changeDTO = { ...payload };
      if (changeDTO.password?.trim()) {
        changeDTO.password = SHA(changeDTO.password);
      }
      const resp = yield call(POST, '/admin/user/changePassword', changeDTO);
      if (callback) callback(resp);
    },

    /**
     * 获取用户设置
     *
     * 非 admin 用户通过此接口获取个人设置信息。
     */
    * fetchUserSettings({ payload }: any, { call, put }: any) {
      yield put({ type: 'setUserSettingsLoading', payload: true });
      try {
        const resp = yield call(POST, '/api/v1/user/settings/get', { userId: payload.userId });
        if (resp?.success) {
          yield put({ type: 'setUserSettings', payload: resp.data });
        }
      } finally {
        yield put({ type: 'setUserSettingsLoading', payload: false });
      }
    },

    /**
     * 更新用户设置
     *
     * 非 admin 用户通过此接口更新个人设置信息。
     */
    * updateUserSettings({ payload, callback }: any, { call, put }: any) {
      const resp = yield call(POST, '/api/v1/user/settings/update', payload);
      if (callback) callback(resp);
      if (resp?.success) {
        yield put({ type: 'setUserSettings', payload: resp.data });
      }
    },

    /**
     * 非 admin 用户修改密码
     *
     * 对密码进行 SHA 哈希后提交修改，成功后提示并退出登录。
     */
    * changePassword({ payload, callback }: any, { call, put }: any) {
      const changeDTO = { ...payload };
      if (changeDTO.password?.trim()) {
        changeDTO.password = SHA(changeDTO.password);
      }
      const resp = yield call(POST, '/api/v1/user/password', changeDTO);
      if (callback) callback(resp);
      if (resp?.success) {
        Notice.success('修改成功', '密码已更新，请重新登录');
        yield put({ type: 'logout' });
      }
    },
  },

  reducers: {
    setUser(state: any, { payload }: any) {
      const token = sessionStorage.getItem(storageKey('token'));
      return { ...state, currentUser: payload, isAuthenticated: !!token };
    },
    clearUser(state: any) {
      return { ...state, currentUser: null, isAuthenticated: false };
    },
    setLoading(state: any, { payload }: any) {
      return { ...state, loading: payload };
    },
    setValidatingToken(state: any, { payload }: any) {
      return { ...state, validatingToken: payload };
    },
    setUserSettings(state: any, { payload }: any) {
      return { ...state, userSettings: payload };
    },
    setUserSettingsLoading(state: any, { payload }: any) {
      return { ...state, userSettingsLoading: payload };
    },
  },
};
