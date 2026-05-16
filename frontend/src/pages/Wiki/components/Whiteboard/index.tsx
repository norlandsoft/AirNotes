import React, {useEffect, useRef, useState} from "react";
import {connect} from 'umi';
import {Excalidraw,} from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import {Result} from "antd";
import debounce from "lodash.debounce";

// 屏蔽Excalidraw帮助按钮和library按钮
import "./whiteboard-hide-btn.css";

interface WhiteboardProps {
  elements: any[];
  appState: any;
}

const Whiteboard: React.FC<any> = props => {

  const {
    dispatch,
    height,
    width,
    wiki: {
      currentDocument
    },
    docLoading
  } = props;

  const defaultContent = {
    elements: [],
    appState: {}
  }

  // 提取关键字段用于变化检测
  const getContentSnapshot = (elements: any[], appState: any) => {
    // 只关注真正影响内容的字段
    const filteredElements = elements.map(element => ({
      id: element.id,
      type: element.type,
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
      angle: element.angle,
      strokeColor: element.strokeColor,
      backgroundColor: element.backgroundColor,
      fillStyle: element.fillStyle,
      strokeWidth: element.strokeWidth,
      strokeStyle: element.strokeStyle,
      roundness: element.roundness, // 圆角/方角状态
      text: element.text,
      points: element.points,
      opacity: element.opacity,
      roughness: element.roughness,
      isDeleted: element.isDeleted, // 删除状态
      groupIds: element.groupIds, // 分组信息
      boundElements: element.boundElements, // 绑定元素（箭头连接等）
      link: element.link, // 链接信息
      locked: element.locked, // 锁定状态
      // 排除选择状态、时间戳等临时属性
    }));

    // 关注影响内容和视图状态的 appState 属性
    const filteredAppState = {
      // theme: appState.theme,
      // viewBackgroundColor: appState.viewBackgroundColor,
      zoom: appState.zoom,
      scrollX: appState.scrollX,
      scrollY: appState.scrollY,
      // 排除 selectedElementIds、cursorButton 等交互状态
    };

    return JSON.stringify({
      elements: filteredElements,
      appState: filteredAppState
    });
  };

  // 保存上一次的元素内容快照（不含 selection 状态）
  const lastElementsSnapshot = useRef<string>(getContentSnapshot(defaultContent.elements || [], defaultContent.appState || {}));
  const [whiteboardContent, setWhiteboardContent] = useState<WhiteboardProps>(defaultContent);

  // 记录上一次是否有选中元素，用于检测取消选中事件
  const hadSelectionRef = useRef<boolean>(false);

  const clearDataAndHistory = () => {
    const initialSnapshot = getContentSnapshot(defaultContent.elements || [], defaultContent.appState || {});
    lastElementsSnapshot.current = initialSnapshot;

    setWhiteboardContent(defaultContent);
  }

  const excalidrawAPIRef = useRef<any>(null);
  const isUpdatingRef = useRef<boolean>(false); // 标记是否正在通过 API 更新，避免触发保存

  useEffect(() => {
    if (currentDocument?.id) {
      // 保存时不能加载
      loadWhiteboard();
    }

    return () => {
      // 清理
      clearDataAndHistory();
      excalidrawAPIRef.current = null;
      isUpdatingRef.current = false;
    }
  }, [currentDocument]);

  const loadWhiteboard = () => {
    isUpdatingRef.current = true; // 标记正在更新
    dispatch({
      type: 'wiki/fetchDocInfo',
      payload: {
        id: currentDocument.id
      },
      callback: (data: any) => {
        try {
          // 安全解析内容 - 注意这里是 data.content 而不是 resp.content
          const content = data.content ? JSON.parse(data.content) : defaultContent;

          // 确保数据结构完整
          if (!content.elements) content.elements = [];
          if (!content.appState) content.appState = {};

          // 确保 appState 包含 Excalidraw 必需的属性
          if (!content.appState.collaborators) content.appState.collaborators = [];

          // 设置初始快照，避免首次加载触发保存
          const initialSnapshot = getContentSnapshot(content.elements || [], content.appState || {});
          lastElementsSnapshot.current = initialSnapshot;

          setWhiteboardContent(content);

          // 使用 API 更新 Excalidraw 内容
          setTimeout(() => {
            if (excalidrawAPIRef.current) {
              excalidrawAPIRef.current.updateScene({
                elements: content.elements,
                appState: content.appState
              });

              // 延迟重置标记，确保更新完成
              setTimeout(() => {
                // 在内容更新完成后，再次触发resize事件，确保画板正确调整尺寸
                window.dispatchEvent(new Event('resize'));
                isUpdatingRef.current = false;
              }, 200); // 增加延迟，确保所有初始化完成
            }
          }, 100);
        } catch (error) {
          console.error('解析白板内容失败：', error);
          clearDataAndHistory();
          isUpdatingRef.current = false;
        }
      }
    });
  }

  // 防抖保存函数
  const saveWhiteboard = debounce((elements, appState, files) => {
    // 确保参数安全
    if (!elements || !appState) {
      return;
    }

    const content: WhiteboardProps = {
      elements,
      appState
    }
    const contentStr = JSON.stringify(content);

    dispatch({
      type: 'wiki/updateDoc',
      payload: {
        id: currentDocument.id,
        content: contentStr
      }
    });
  }, 1000);


  const handleChange = (elements: any, appState: any, files: any) => {
    // 如果正在通过 API 更新或初始加载中，跳过保存
    if (isUpdatingRef.current || docLoading) {
      return;
    }

    // 检测取消选中事件：从有选中元素变为无选中元素时触发保存
    const selectedIds = appState?.selectedElementIds || {};
    const hasSelection = Object.values(selectedIds).some(Boolean);
    if (hadSelectionRef.current && !hasSelection) {
      hadSelectionRef.current = false;
      saveWhiteboard(elements, appState, files);
      // 更新快照，避免后续 onChange 重复保存相同内容
      lastElementsSnapshot.current = getContentSnapshot(elements || [], appState || {});
      return;
    }
    hadSelectionRef.current = hasSelection;

    // 获取内容快照（只包含关键字段）
    const currentSnapshot = getContentSnapshot(elements || [], appState || {});

    // 只有关键内容发生变化时才保存, 且加载时不能保存
    if (currentSnapshot !== lastElementsSnapshot.current && !isUpdatingRef.current && !docLoading) {
      lastElementsSnapshot.current = currentSnapshot;
      saveWhiteboard(elements, appState, files);
    }
  };

  return (
      <div style={{height: height, width: width}}>
        {
          docLoading ? (
              <Result icon={null} title="加载中..."/>
          ) : (
              <Excalidraw
                  key={`whiteboard-${currentDocument?.id}`}
                  excalidrawAPI={(api) => {
                    excalidrawAPIRef.current = api;
                  }}
                  initialData={{
                    appState: {
                      collaborators: [],
                      theme: "light",
                      viewBackgroundColor: "#fefefe",
                      ...whiteboardContent.appState
                    },
                    elements: whiteboardContent.elements || [],
                  }}
                  UIOptions={{
                    canvasActions: {
                      toggleTheme: false,
                      clearCanvas: true,
                      saveAsImage: true,
                      loadScene: false,
                    },
                    tools: {
                      image: false,
                    },
                  }}
                  langCode="zh-CN"
                  onChange={handleChange}
              />
          )
        }
      </div>
  );
};

export default connect(({wiki, loading}) => ({
  wiki,
  docLoading: loading.effects['wiki/fetchDocInfo']
}))(Whiteboard);
