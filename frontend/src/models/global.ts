const HEADER_HEIGHT = 40;

export default {
  namespace: 'global',
  state: {
    layoutSize: {
      headerHeight: HEADER_HEIGHT,
    },
    frameSize: {
      width: window.innerWidth,
      height: window.innerHeight - HEADER_HEIGHT,
      slideHeight: window.innerHeight - HEADER_HEIGHT,
    }
  },
  reducers: {
    changeFrameSize(state: any) {
      return {
        ...state,
        frameSize: {
          width: window.innerWidth,
          height: window.innerHeight - state.layoutSize.headerHeight,
          slideHeight: window.innerHeight - state.layoutSize.headerHeight,
        }
      }
    }
  }
};
