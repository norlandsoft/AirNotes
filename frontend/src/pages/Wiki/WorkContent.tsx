import React, {useEffect} from "react";
import {connect} from 'umi';
import SpaceInfo from './space/SpaceInfo';

// 文档
import DocumentEditor from './document/DocumentEditor';
import Whiteboard from './components/Whiteboard';
import MindMap from './components/MindMap';

interface WikiWorkContentProps {
  width: number;
}

const WorkContent: React.FC<WikiWorkContentProps | any> = props => {

  const {
    dispatch,
    width,
    height,
    wiki: {
      currentSpace,
      currentDocument
    }
  } = props;

  useEffect(() => {
    // 当切换空间时，显示新空间信息
    if (currentSpace?.id) {
      dispatch({
        type: 'wiki/setCurrentDoc',
        payload: {}
      });
    }
  }, [currentSpace]);

  return (
      <>
        {
          // 显示文档内容或空间信息
          currentDocument?.id && currentDocument.id !== '000000' ? (
              (() => {
                switch (currentDocument.format) {
                  case 'doc':
                    // 文档
                    return <DocumentEditor height={height} width={width - 15}/>;
                  case 'board':
                    // 白板
                    return <Whiteboard height={height} width={width}/>;
                  case 'mind':
                    // 思维导图
                    return <MindMap height={height} width={width}/>;
                  default:
                    // 文件
                    return <div>FILES</div>;
                }
              })()
          ) : (
              <SpaceInfo/>
          )
        }
      </>
  );
}

export default connect(({wiki}) => ({
  wiki
}))(WorkContent);
