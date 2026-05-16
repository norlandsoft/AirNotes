export default {
  namespace: 'global',
  state: {
    frameSize: {
      width: window.innerWidth,
      height: window.innerHeight,
      slideHeight: window.innerHeight
    }
  },
  reducers: {
    changeFrameSize(state: any) {
      return {
        ...state,
        frameSize: {
          width: window.innerWidth,
          height: window.innerHeight,
          slideHeight: window.innerHeight,
        }
      }
    }
  }
};
