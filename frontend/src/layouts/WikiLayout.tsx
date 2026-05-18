import React, {useEffect} from 'react';
import {connect} from 'umi';
import {AntdSpin as Spin} from 'air-design';
import Login from '@/pages/Login';
import Wiki from '@/pages/Wiki';
import HeadBar from './HeadBar';

const WikiLayout: React.FC<any> = props => {
  const {dispatch, user, layoutSize, frameSize} = props;

  useEffect(() => {
    const handleResize = () => {
      dispatch({type: 'global/changeFrameSize'});
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [dispatch]);

  useEffect(() => {
    if (user.isAuthenticated) {
      dispatch({type: 'user/validateToken'});
    }
  }, []);

  if (user.isAuthenticated === false) {
    return <Login/>;
  }

  if (!user.currentUser) {
    return <Spin spinning={true} fullscreen tip="正在验证身份..."/>;
  }

  return (
    <>
      <HeadBar height={layoutSize.headerHeight}/>
      <div style={{
        position: 'fixed',
        top: layoutSize.headerHeight,
        width: frameSize.width,
        height: frameSize.height
      }}>
        <Wiki/>
      </div>
    </>
  );
};

export default connect(({user, global}) => ({
  user,
  layoutSize: global.layoutSize,
  frameSize: global.frameSize,
}))(WikiLayout);
