import React, {useEffect} from 'react';
import {connect} from 'umi';
import {Spin} from 'antd';
import Login from '@/pages/Login';
import Wiki from '@/pages/Wiki';

const WikiLayout: React.FC<any> = props => {
  const {dispatch, user} = props;

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

  return <Wiki/>;
};

export default connect(({user, global}) => ({
  user,
  frameSize: global.frameSize,
}))(WikiLayout);
