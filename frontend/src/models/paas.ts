import {POST} from 'air-auth';

/**
 * PaaS 配置 DVA model
 *
 * 管理数据库和 Redis 连接配置的状态和 API 调用。
 *
 * @author ChaiMingXu
 * @since 2026/5/26
 */
export default {
  namespace: 'paas',

  state: {
    databaseConfig: {},
    redisConfig: {},
    loading: false,
  },

  effects: {
    * fetchDatabaseConfig({callback}, {put}) {
      const resp = yield POST('/admin/paas/database/get', {});
      if (resp?.success) {
        yield put({type: 'setDatabaseConfig', payload: resp.data || {}});
      }
      if (callback) callback(resp);
    },

    * saveDatabaseConfig({payload, callback}, {put}) {
      const resp = yield POST('/admin/paas/database/save', payload);
      if (resp?.success) {
        yield put({type: 'setDatabaseConfig', payload: resp.data || {}});
      }
      if (callback) callback(resp);
    },

    * fetchRedisConfig({callback}, {put}) {
      const resp = yield POST('/admin/paas/redis/get', {});
      if (resp?.success) {
        yield put({type: 'setRedisConfig', payload: resp.data || {}});
      }
      if (callback) callback(resp);
    },

    * saveRedisConfig({payload, callback}, {put}) {
      const resp = yield POST('/admin/paas/redis/save', payload);
      if (resp?.success) {
        yield put({type: 'setRedisConfig', payload: resp.data || {}});
      }
      if (callback) callback(resp);
    },
  },

  reducers: {
    setDatabaseConfig(state, action) {
      return {...state, databaseConfig: action.payload};
    },
    setRedisConfig(state, action) {
      return {...state, redisConfig: action.payload};
    },
    setLoading(state, action) {
      return {...state, loading: action.payload};
    },
  },
};
