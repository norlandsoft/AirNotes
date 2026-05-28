import {POST} from 'air-auth';

export default {
  namespace: 'wiki',
  state: {
    currentSpace: {},
    recentSpaces: [],
    currentDocumentMenu: [],
    currentDocument: {},
    showSpaces: true
  },
  effects: {
    * createSpace({payload, callback}, {call, put}) {
      const resp = yield POST("/rest/wiki/space/create", payload);
      if (callback) {
        callback(resp);
      }
    },

    * updateSpace({payload, callback}, {call, put}) {
      const resp = yield POST("/rest/wiki/space/update", payload);
      if (resp.success) {
        yield put({
          type: 'saveDocSpace',
          payload: resp.data
        })
      }
      if (callback) callback(resp);
    },

    * fetchSpaces({payload, callback}, {call, put}) {
      const resp = yield POST("/rest/wiki/space/list", payload);
      if (callback) {
        callback(resp);
      }
    },

    * fetchSpaceInfo({payload, callback}, {call, put}) {
      const resp = yield POST("/rest/wiki/space/info", payload);
      if (resp.success && callback) {
        callback(resp.data);
      }
    },

    * addRecentSpace({payload, callback}, {call, put}) {
      const resp = yield POST("/rest/wiki/space/recent/add", payload);
      if (callback) {
        callback(resp);
      }

      yield put({
        type: 'setShowSpaces',
        payload: false
      });
    },

    * fetchRecentSpaces({payload, callback}, {_, put}) {
      const resp = yield POST("/rest/wiki/space/recent", payload);
      if (resp.success) {
        yield put({
          type: 'saveRecentSpaces',
          payload: resp.data
        });

        if (callback) callback(resp.data);
      } else {
        yield put({
          type: 'saveRecentSpaces',
          payload: []
        });
        yield put({
          type: 'setShowSpaces',
          payload: true
        });
      }
    },

    * fetchDocMenu({payload}, {call, put}) {
      const resp = yield POST("/rest/wiki/docs/menu", payload);
      if (resp.success) {
        yield put({
          type: 'saveCurrentDocumentMenu',
          payload: resp.data
        });
      }
    },

    * fetchDocInfo({payload, callback}, {call, put}) {
      const resp = yield POST("/rest/wiki/docs/info", payload);
      if (resp.success && callback) {
        callback(resp.data);
      }
    },

    * updateDoc({payload, callback}, {call, put}) {
      const resp = yield POST("/rest/wiki/docs/update", payload);
      if (callback) {
        callback(resp);
      }
    },

    * updateMindMap({payload, callback}, {call, put}) {
      const resp = yield POST("/rest/wiki/mind/update", payload);
      if (callback) {
        callback(resp);
      }
    },

    * fetchMindMap({payload, callback}, {call, put}) {
      const resp = yield POST("/rest/wiki/mind/items", payload);
      if (callback) {
        callback(resp);
      }
    },

    * removeDoc({payload, callback}, {call, put}) {
      const resp = yield POST("/rest/wiki/docs/remove", payload);
      if (callback) {
        callback(resp);
      }
    }
  },
  reducers: {
    saveDocSpace(state, action) {
      return {
        ...state,
        currentSpace: action.payload
      }
    },
    saveRecentSpaces(state, action) {
      // 获取最近空间
      let current: any;
      if (action.payload.length === 0) {
        current = {};
      } else {
        current = action.payload[0];
      }
      return {
        ...state,
        currentSpace: current,
        recentSpaces: action.payload
      }
    },
    saveCurrentDocumentMenu(state, action) {
      return {
        ...state,
        currentDocumentMenu: action.payload
      }
    },
    setShowSpaces(state, action) {
      return {
        ...state,
        showSpaces: action.payload
      }
    },
    setCurrentDoc(state, action) {
      return {
        ...state,
        currentDocument: action.payload
      }
    },
    setCurrentSpace(state, action) {
      return {
        ...state,
        currentSpace: action.payload
      }
    }
  }
}
