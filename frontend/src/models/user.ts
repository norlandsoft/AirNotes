import {POST} from "@/utils/HttpRequest";

export default {
  namespace: 'user',
  state: {
    currentUser: null,
    isAuthenticated: !!sessionStorage.getItem('air-notes-token'),
    loading: false
  },
  effects: {
    * login({payload}, {put}) {
      yield put({type: 'setLoading', payload: true});

      // admin 用户走管理后台登录，其他用户走 SSO 登录
      const isAdmin = payload.id && payload.id.trim().toLowerCase() === 'admin';
      const loginUrl = isAdmin ? '/admin/user/login' : '/rest/auth/login';
      const resp = yield POST(loginUrl, payload);

      yield put({type: 'setLoading', payload: false});

      if (resp.success) {
        const {token, user} = resp.data;
        sessionStorage.setItem('air-notes-token', token);
        sessionStorage.setItem('air-notes-user', user.id || user.loginId || payload.id);
        yield put({type: 'setUser', payload: user});
      } else {
        yield put({type: 'setUser', payload: null});
      }
    },

    * validateToken(_, {put}) {
      const token = sessionStorage.getItem('air-notes-token');
      const userId = sessionStorage.getItem('air-notes-user');

      if (!token || !userId) {
        yield put({type: 'clearUser'});
        return;
      }

      const resp = yield POST("/rest/auth/current");
      if (resp.success) {
        yield put({type: 'setUser', payload: resp.data});
      } else {
        yield put({type: 'clearUser'});
      }
    },

    * logout(_, {put}) {
      sessionStorage.removeItem('air-notes-token');
      sessionStorage.removeItem('air-notes-user');
      yield put({type: 'clearUser'});
    },

    * changePassword({payload, callback}, {put}) {
      const resp = yield POST("/admin/user/changePassword", payload);
      if (callback) callback(resp);
    }
  },
  reducers: {
    setUser(state, action) {
      return {
        ...state,
        currentUser: action.payload,
        isAuthenticated: !!action.payload,
        loading: false
      };
    },
    clearUser(state) {
      sessionStorage.removeItem('air-notes-token');
      sessionStorage.removeItem('air-notes-user');
      return {
        ...state,
        currentUser: null,
        isAuthenticated: false,
        loading: false
      };
    },
    setLoading(state, action) {
      return {...state, loading: action.payload};
    }
  }
};
