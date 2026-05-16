import React, {useEffect} from 'react';
import {connect} from 'umi';
import Wiki from '@/pages/Wiki';

const WikiLayout: React.FC<any> = props => {
  const {dispatch} = props;

  useEffect(() => {
    const handleResize = () => {
      dispatch({type: 'global/changeFrameSize'});
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [dispatch]);

  return <Wiki/>;
};

export default connect(({global}) => ({
  frameSize: global.frameSize,
}))(WikiLayout);
