import React, {useEffect, useRef, useState} from 'react';
import {connect} from 'umi';
import {Spin} from "antd";
import {MindPanel} from 'air-design';
import type {MindData} from 'air-design';

const MindMap: React.FC<any> = props => {

  const {
    dispatch,
    height,
    width,
    wiki: {
      currentDocument
    },
    docLoading
  } = props;

  const [showLoading, setShowLoading] = useState(false);
  const isUpdatingRef = useRef<boolean>(false); // 标记是否正在通过 API 更新，避免触发保存
  const mindMapData = useRef<MindData>();

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoading(true);
    }, 200);

    if (currentDocument?.id) {
      // 保存时不能加载
      loadMindMap();
    }

    return () => {
      isUpdatingRef.current = false;
      setShowLoading(false);
      clearTimeout(timer);
    }
  }, [currentDocument]);

  const loadMindMap = () => {
    isUpdatingRef.current = true; // 标记正在更新

    dispatch({
      type: 'wiki/fetchDocInfo',
      payload: {
        id: currentDocument.id
      },
      callback: resp => {
        dispatch({
          type: 'wiki/fetchMindMap',
          payload: {
            documentId: currentDocument.id
          },
          callback: mapResp => {
            if (mapResp.success) {
              const layout = JSON.parse(resp.content);
              mindMapData.current = {
                layout: layout.layout,
                data: mapResp.data
              };
            }
            isUpdatingRef.current = false;
          }
        });
      }
    });
  }

  const handleSaveData = (mindData: any) => {
    if (isUpdatingRef.current || docLoading) {
      return;
    }

    const {layout, data} = mindData;

    // 保存布局
    if (layout) {
      dispatch({
        type: 'wiki/updateDoc',
        payload: {
          id: currentDocument.id,
          content: JSON.stringify({layout: layout})
        }
      });
    }

    // 保存数据
    if (data) {
      dispatch({
        type: 'wiki/updateMindMap',
        payload: data
      });
    }
  }

  return (
      <div style={{height: height, width: width}}>
        {
          showLoading ? (
              !isUpdatingRef.current && (
                  <MindPanel
                      height={height}
                      width={width}
                      documentId={currentDocument.id}
                      data={mindMapData.current ?? null}
                      onSave={handleSaveData}
                  />
              )
          ) : (
              <div className={'air-flow-loading-wrapper'}>
                <Spin
                    tip="加载中"
                    size="large"
                >
                  <div className={'air-flow-loading'}/>
                </Spin>
              </div>
          )
        }
      </div>
  );
};

export default connect(({loading, wiki}) => ({
  docLoading: loading.effects['wiki/fetchDocInfo'],
  wiki
}))(MindMap);
