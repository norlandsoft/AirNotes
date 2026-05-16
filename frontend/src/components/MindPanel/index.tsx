import React, {useCallback, useEffect, useRef, useState} from 'react';
import {IconButton} from 'air-design';
import {applyNodeChanges, Controls, Edge, Node, ReactFlow, useReactFlow} from '@xyflow/react';
import FirstStepEdge from './edges/FirstStepEdge';
import RoundedStepEdge from './edges/RoundedStepEdge';
import '@xyflow/react/dist/style.css';

import {MindData, MindNodeData} from './data/MindData';
import TopicNode from './nodes/TopicNode';
import {processMapData} from './utils/MindDataProcessor';
import {MIND_NODE_COLORS} from './data/colors';
import {calculateMindMapLayout} from './utils/MindLayoutCalculator';

interface MindProps {
  height: number;
  width: number;
  documentId: string;
  data: MindData | null;
  onSave?: (nodes: MindData) => void;
}

// 内部组件：处理滚轮缩放
const MindFlowWithZoom: React.FC<{ children: React.ReactNode }> = ({children}) => {
  const {zoomIn, zoomOut} = useReactFlow();

  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      // 检查是否按住了Ctrl键
      if (event.ctrlKey) {
        event.preventDefault(); // 阻止默认行为
        if (event.deltaY < 0) {
          zoomIn(); // 向上滚动，放大
        } else {
          zoomOut(); // 向下滚动，缩小
        }
      }
    };

    // 添加滚轮事件监听器
    document.addEventListener('wheel', handleWheel, {passive: false});

    return () => {
      document.removeEventListener('wheel', handleWheel);
    };
  }, [zoomIn, zoomOut]);

  return <>{children}</>;
};

const MindEditor: React.FC<MindProps> = props => {

  const {
    height, width, documentId, data, onSave
  } = props;

  // 节点和边状态
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  // 画板位置和缩放
  const viewportRef = React.useRef<{ x: number, y: number, zoom: number }>({x: width / 2, y: height / 2, zoom: 1});

  // 保存 ReactFlow 实例引用，用于控制视口
  const reactFlowInstanceRef = useRef<any>(null);

  // 跟踪是否有节点处于可编辑状态，用于禁用画布拖动
  const [hasEditingNode, setHasEditingNode] = useState(false);
  const editingNodesRef = useRef<Set<string>>(new Set());

  // 使用 useRef 保存整体的 mapData，作为单一数据源
  const mapDataRef = useRef<MindNodeData[]>([]);

  /**
   * 基于折叠状态过滤可见节点
   * 设计思路：
   * - 被折叠节点本身仍然可见
   * - 被折叠节点的所有后代（子节点、子节点的后续节点）全部隐藏
   * - 过滤发生在布局计算之前，确保画布布局会随折叠状态收缩，效果更接近 xmind
   */
  const filterVisibleByCollapse = (fullMapData: MindNodeData[]): MindNodeData[] => {
    if (!fullMapData || fullMapData.length === 0) return [];

    // 构建 parentId -> childrenIds 映射
    const childrenMap = new Map<string, string[]>();
    fullMapData.forEach(n => {
      const pid = n.parentId ?? '000000';
      if (!childrenMap.has(pid)) childrenMap.set(pid, []);
      childrenMap.get(pid)!.push(n.id);
    });

    // 计算需要隐藏的后代节点集合
    const hiddenIds = new Set<string>();
    const collapsedIds = fullMapData.filter(n => !!n.collapsed).map(n => n.id);

    const collectDescendants = (startId: string) => {
      const queue: string[] = [];
      const directChildren = childrenMap.get(startId) ?? [];
      directChildren.forEach(cid => queue.push(cid));

      while (queue.length > 0) {
        const cur = queue.shift()!;
        if (hiddenIds.has(cur)) continue;
        hiddenIds.add(cur);
        const next = childrenMap.get(cur) ?? [];
        next.forEach(nid => queue.push(nid));
      }
    };

    collapsedIds.forEach(collectDescendants);

    // 返回可见节点（折叠节点本身保留）
    return fullMapData.filter(n => !hiddenIds.has(n.id));
  };

  // 使用 useRef 保存最新的 processMapDataAndRender，避免闭包问题
  const processMapDataAndRenderRef = useRef<(newMapData?: MindNodeData[]) => void>();

  // 使用 useRef 保存最新的 handleSave，避免闭包问题
  const handleSaveRef = useRef<(changeType: 'node' | 'viewport') => void>();

  // 统一的状态更新函数（移除自动布局）
  const updateMindMap = useCallback((newNodes: Node[], newEdges: Edge[]) => {
    setNodes(newNodes);
    setEdges(newEdges.map(edge => ({...edge, type: edge.type ?? 'roundedstep'})));
  }, []); // 移除 dragTargetNodeId 依赖，避免重新渲染

  // 公共方法：处理mapData并渲染到ReactFlow
  // 所有操作都应该先修改 mapDataRef.current，然后调用此方法进行渲染
  const processMapDataAndRender = useCallback((newMapData?: MindNodeData[]) => {

    // 如果未提供 newMapData，使用 mapDataRef.current
    const fullMapDataToProcess = newMapData ?? mapDataRef.current;

    // 更新 mapDataRef
    mapDataRef.current = fullMapDataToProcess;
    try {
      // 基于折叠状态过滤可见节点（用于布局与渲染）
      const mapDataToRender = filterVisibleByCollapse(fullMapDataToProcess);

      // 步骤1：计算节点的尺寸和布局
      const sized = processMapData(mapDataToRender);
      const layouted = calculateMindMapLayout(sized);

      // 注意：dragTargetNodeId 用于标记拖动目标节点，需要在节点数据中设置

      // 步骤2：将 mapData 转换为 ReactFlow 的节点和边
      // 为 level1 节点按顺序分配颜色，并将其后代使用同色的浅色（50%）
      const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
        const m = /^#?([\da-fA-F]{2})([\da-fA-F]{2})([\da-fA-F]{2})$/.exec(hex);
        if (!m) return null;
        return {r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16)};
      };
      const rgbToHex = (r: number, g: number, b: number): string => {
        const toHex = (v: number) => v.toString(16).padStart(2, '0');
        return `#${toHex(Math.max(0, Math.min(255, Math.round(r))))}${toHex(Math.max(0, Math.min(255, Math.round(g))))}${toHex(Math.max(0, Math.min(255, Math.round(b))))}`;
      };
      const lightenHex = (hex: string, ratio: number): string => {
        const rgb = hexToRgb(hex);
        if (!rgb) return hex;
        const {r, g, b} = rgb;
        const lr = r + (255 - r) * ratio;
        const lg = g + (255 - g) * ratio;
        const lb = b + (255 - b) * ratio;
        return rgbToHex(lr, lg, lb);
      };

      const level1List = layouted.filter(d => d.level === 1);
      const level1ColorMap = new Map<string, string>();
      level1List.forEach((n, idx) => {
        const color = MIND_NODE_COLORS[idx % MIND_NODE_COLORS.length];
        level1ColorMap.set(n.id, color);
      });

      // 构建 id->node 与 id->parentId 以及求level1祖先
      const idToNode = new Map<string, MindNodeData>();
      layouted.forEach(n => idToNode.set(n.id, n));
      const getLevel1AncestorId = (nodeId: string): string | null => {
        let cur = idToNode.get(nodeId);
        const guard = 1000;
        let steps = 0;
        while (cur && cur.level > 1 && steps < guard) {
          cur = cur.parentId ? idToNode.get(cur.parentId) : undefined;
          steps++;
        }
        if (cur && cur.level === 1) return cur.id;
        return null;
      };

      // 构建可见节点ID集合，用于验证边的有效性
      const visibleNodeIds = new Set<string>(layouted.map(n => n.id));

      // 计算每个节点的直接子节点数量（基于原始 mapData）
      // 设计思路：
      // - 子节点数量用于前端展示（节点后面的数字标识）
      // - 只统计直接子节点，不统计后代
      const nodeChildCountMap = new Map<string, number>();
      fullMapDataToProcess.forEach(node => nodeChildCountMap.set(node.id, 0));
      fullMapDataToProcess.forEach(node => {
        const parentId = node.parentId;
        if (!parentId || parentId === '000000') return;
        nodeChildCountMap.set(parentId, (nodeChildCountMap.get(parentId) ?? 0) + 1);
      });

      const reactFlowNodes: Node[] = layouted.map(d => ({
        id: d.id,
        type: 'topic',
        data: {
          value: d.value,
          documentId: d.documentId,
          parentId: d.parentId ?? '000000',
          level: d.level,
          levelMaxWidth: d.levelMaxWidth,
          childCount: nodeChildCountMap.get(d.id) ?? 0,
          collapsed: !!(d as any).collapsed,
          color: ((): string | undefined => {
            // 根据层级和level1祖先计算颜色（不再从数据中读取颜色）
            if (d.level === 1) return level1ColorMap.get(d.id);
            if (d.level >= 2) {
              const anc1 = d.parentId ? getLevel1AncestorId(d.id) : null;
              if (anc1) {
                const base = level1ColorMap.get(anc1);
                if (base) return lightenHex(base, 0.75); // 变浅75%
              }
            }
            return undefined;
          })(),
        },
        position: {x: d.x, y: d.y},
        draggable: false,
        selectable: true,
      }));
      const reactFlowEdges: Edge[] = layouted
          .filter(d => {
            // 只保留有效的边：parentId 存在且 source 和 target 都在可见节点列表中
            const parentId = d.parentId;
            return !!parentId &&
                parentId !== '000000' &&
                visibleNodeIds.has(parentId) &&
                visibleNodeIds.has(d.id);
          })
          .map(d => ({
            id: `edge-${d.id}`,
            source: d.parentId as string,
            target: d.id,
            sourceHandle: 'right',
            targetHandle: 'left',
            type: d.level === 1 ? 'firststep' : 'roundedstep',
            data: ((): any => {
              if (d.level === 1) {
                return {width: 2, offsetStart: 30, bendOffsetEnd: 30, color: level1ColorMap.get(d.id)};
              }
              if (d.level >= 2) {
                const anc1 = getLevel1AncestorId(d.id);
                if (anc1) {
                  const base = level1ColorMap.get(anc1);
                  if (base) return {radius: 8, color: base};
                }
              }
              return {radius: 8};
            })(),
            style: ((): any => {
              if (d.level === 1) return {stroke: level1ColorMap.get(d.id) as string};
              if (d.level >= 2) {
                const anc1 = getLevel1AncestorId(d.id);
                if (anc1) {
                  const base = level1ColorMap.get(anc1);
                  if (base) return {stroke: base};
                }
              }
              return undefined;
            })(),
          }));

      // 步骤3：在 ReactFlow 中渲染
      updateMindMap(reactFlowNodes, reactFlowEdges);
      return true;
    } catch (error) {
      return false;
    }
  }, [updateMindMap]); // 移除 dragTargetNodeId 依赖，避免重新渲染

  // 同步更新 processMapDataAndRenderRef，确保总是使用最新的函数
  processMapDataAndRenderRef.current = processMapDataAndRender;

  // 添加子节点：操作 mapDataRef -> 重新计算布局并渲染
  const addChildNode = useCallback((parentId: string, level: number, nodeType: string) => {
    const childId = `item-${documentId}-${Date.now()}`;

    // 一、获取当前的 mapData
    const currentMapData = mapDataRef.current;

    // 1) 如果父节点处于折叠状态，先展开，避免新增节点不可见
    const expandedMapData = currentMapData.map(n => {
      if (n.id === parentId && n.collapsed) {
        return {...n, collapsed: false};
      }
      return n;
    });

    // 二、添加新节点到 mapData
    const newChildData: MindNodeData = {
      id: childId,
      level: level,
      parentId: parentId,
      documentId: documentId,
      value: level == 1 ? '主题' : '子主题',
      x: 100,
      y: 100,
      ym: 100,
    };
    const newMapData = [...expandedMapData, newChildData];

    // 三、重新计算布局并渲染
    processMapDataAndRender(newMapData);

    // 四、触发保存（节点新增）
    handleSaveRef.current?.('node');
  }, [processMapDataAndRender]);

  // 删除节点：操作 mapDataRef -> 重新计算布局并渲染
  const deleteNode = useCallback((nodeId: string) => {
    // 0. 判断是否为根节点（level 0），根节点不可删除
    if (nodeId === 'mind-root') {
      return;
    }

    // 一、获取当前的 mapData
    const currentMapData = mapDataRef.current;

    // 递归获取所有后代节点ID（基于mapData）
    const getAllDescendants = (parentId: string, currentMapData: MindNodeData[]): string[] => {
      const children = currentMapData
          .filter(node => node.parentId === parentId)
          .map(node => node.id);

      let descendants = [...children];
      children.forEach(childId => {
        descendants = descendants.concat(getAllDescendants(childId, currentMapData));
      });
      return descendants;
    };

    const descendantsToDelete = getAllDescendants(nodeId, currentMapData);
    const allNodesToDelete = [nodeId, ...descendantsToDelete];

    // 二、删除节点及其所有子节点
    const remainingMapData = currentMapData.filter(node => !allNodesToDelete.includes(node.id));

    // 三、重新计算布局并渲染
    processMapDataAndRender(remainingMapData);

    // 四、触发保存（节点删除）
    handleSaveRef.current?.('node');
  }, [processMapDataAndRender]);

  // 更新节点内容：操作 mapDataRef -> 重新计算布局并渲染
  const updateNodeContent = useCallback((nodeId: string, newContent: string) => {
    // 一、获取当前的 mapData
    const currentMapData = mapDataRef.current;

    // 二、更新节点内容
    const updatedMapData = currentMapData.map(node =>
        node.id === nodeId ? {...node, value: newContent} : node
    );

    // 三、重新计算布局并渲染
    processMapDataAndRender(updatedMapData);

    // 四、触发保存（节点内容改变）
    handleSaveRef.current?.('node');
  }, [processMapDataAndRender]);

  // 监听Tab键、删除事件、内容更新事件
  useEffect(() => {
    const handleAddChildNode = (event: CustomEvent) => {
      const {parentId, level, nodeType} = event.detail;
      addChildNode(parentId, level, nodeType);
    };

    const handleDeleteNode = (event: CustomEvent) => {
      const {nodeId} = event.detail;
      deleteNode(nodeId);
    };

    const handleUpdateNodeContent = (event: CustomEvent) => {
      const {nodeId, content} = event.detail;
      updateNodeContent(nodeId, content);
    };

    // 节点折叠/展开：更新 mapDataRef -> 重新渲染 -> 保存
    const handleToggleNodeCollapse = (event: CustomEvent) => {
      const {nodeId, collapsed} = event.detail || {};
      if (!nodeId) return;
      const currentMapData = mapDataRef.current;
      const updatedMapData = currentMapData.map(n => {
        if (n.id === nodeId) {
          return {...n, collapsed: !!collapsed};
        }
        return n;
      });
      processMapDataAndRender(updatedMapData);
      handleSaveRef.current?.('node');
    };

    window.addEventListener('addChildNode', handleAddChildNode as EventListener);
    window.addEventListener('deleteNode', handleDeleteNode as EventListener);
    window.addEventListener('updateNodeContent', handleUpdateNodeContent as EventListener);
    window.addEventListener('toggleNodeCollapse', handleToggleNodeCollapse as EventListener);

    return () => {
      window.removeEventListener('addChildNode', handleAddChildNode as EventListener);
      window.removeEventListener('deleteNode', handleDeleteNode as EventListener);
      window.removeEventListener('updateNodeContent', handleUpdateNodeContent as EventListener);
      window.removeEventListener('toggleNodeCollapse', handleToggleNodeCollapse as EventListener);
    };
  }, [addChildNode, deleteNode, updateNodeContent]);

  // 节点变化处理
  const onNodesChange = useCallback(
      (changes: any) => setNodes(nds => applyNodeChanges(changes, nds)),
      []
  );

  // 初始化处理
  const onInit = useCallback((reactFlowInstance: any) => {
    // 保存 ReactFlow 实例引用
    reactFlowInstanceRef.current = reactFlowInstance;

    if (data?.layout) {
      viewportRef.current = data.layout;
    }

    // 设置初始 viewport
    if (reactFlowInstance && viewportRef.current) {
      reactFlowInstance.setViewport({
        x: viewportRef.current.x,
        y: viewportRef.current.y,
        zoom: viewportRef.current.zoom
      });
    }

    if (data?.data) {
      processMapDataAndRender(data.data);
    }

    setTimeout(() => {
      document.querySelectorAll('div.react-flow__attribution').forEach(panel => panel.remove());
    }, 0);

    // 如果data为空，则创建根节点
    if (!data?.data && nodes.length === 0) {
      // 步骤1：添加数据到 mapData
      const rootData: MindNodeData = {
        id: `root-${documentId}`,
        level: 0,
        parentId: '000000',
        documentId: documentId,
        value: '思维导图',
        x: 0,
        y: 0,
        ym: 0,
      };
      const newMapData: MindNodeData[] = [rootData];

      // 步骤2、3、4：使用公共方法处理mapData并渲染
      const success = processMapDataAndRender(newMapData);

      if (!success) {
        // 降级处理：使用原始数据
        const reactFlowNodes: Node[] = newMapData.map(d => ({
          id: d.id,
          type: 'topic',
          data: {value: d.value, documentId: d.documentId, parentId: d.parentId ?? '000000', level: d.level},
          position: {x: d.x, y: d.y},
          draggable: false,
          selectable: true,
        }));
        const reactFlowEdges: Edge[] = [];
        updateMindMap(reactFlowNodes, reactFlowEdges);
      }
    }

  }, [data, nodes.length, documentId, updateMindMap, processMapDataAndRender]);

  // 监听拖动事件
  useEffect(() => {
    // 拖动开始事件
    const handleDragNodeStart = (e: CustomEvent) => {
      const {nodeId} = e.detail;

      // 获取被拖动节点及其所有子节点的ID
      const getAllDescendants = (parentId: string, currentMapData: MindNodeData[]): string[] => {
        const descendants: string[] = [];
        const queue = [parentId];
        while (queue.length > 0) {
          const currentId = queue.shift()!;
          const children = currentMapData.filter(n => n.parentId === currentId);
          children.forEach(child => {
            descendants.push(child.id);
            queue.push(child.id);
          });
        }
        return descendants;
      };

      const currentMapData = mapDataRef.current;
      const descendants = getAllDescendants(nodeId, currentMapData);
      const draggedNodeIds = [nodeId, ...descendants];

      // 更新节点状态，设置 isBeingDragged 标记
      setNodes(prevNodes => prevNodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          isBeingDragged: draggedNodeIds.includes(node.id),
        }
      })));
    };

    // 拖动移动事件
    const handleDragNodeMove = (e: CustomEvent) => {
      const {nodeId, targetNodeId} = e.detail;
      // 更新目标节点ID（使用 ref，不触发重新渲染）
    };

    // 拖动结束事件
    // 所有判断逻辑基于 mapDataRef.current，确保数据一致性
    const handleDragNodeEnd = (e: CustomEvent) => {
      const {nodeId, targetNodeId} = e.detail;

      // 一、从 mapDataRef.current 获取所有数据（单一数据源）
      const currentMapData = mapDataRef.current;

      // 排除根节点
      if (nodeId === 'mind-root') {
        // 清除半透明效果
        setNodes(prevNodes => prevNodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            isBeingDragged: false,
          }
        })));
        return;
      }

      // 如果没有放置目标，清除半透明效果并返回
      if (!targetNodeId) {
        setNodes(prevNodes => prevNodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            isBeingDragged: false,
          }
        })));
        return;
      }

      // 如果拖动到自身，清除半透明效果并返回
      if (nodeId === targetNodeId) {
        setNodes(prevNodes => prevNodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            isBeingDragged: false,
          }
        })));
        return;
      }

      // 从 mapDataRef.current 获取被拖动节点和目标节点
      const draggedNode = currentMapData.find(n => n.id === nodeId);
      if (!draggedNode) {
        setNodes(prevNodes => prevNodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            isBeingDragged: false,
          }
        })));
        return;
      }

      const targetNode = currentMapData.find(n => n.id === targetNodeId);
      if (!targetNode) {
        setNodes(prevNodes => prevNodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            isBeingDragged: false,
          }
        })));
        return;
      }

      // 获取被拖动节点的当前父节点（从 mapDataRef.current 获取）
      const draggedNodeParentId = draggedNode.parentId === '000000' ? null : (draggedNode.parentId || null);

      // 检查是否拖动到当前父节点（如果是，跳过移动，但仍需要清除半透明效果）
      if (draggedNodeParentId === targetNodeId) {
        // 清除半透明效果
        setNodes(prevNodes => prevNodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            isBeingDragged: false,
          }
        })));
        return;
      }

      // 检查目标节点是否是被拖动节点的后代（防止形成循环）
      const checkIsDescendant = (potentialParentId: string, childId: string, currentMapData: MindNodeData[]): boolean => {
        const getDescendants = (parentId: string): Set<string> => {
          const descendants = new Set<string>();
          const queue = [parentId];
          while (queue.length > 0) {
            const currentId = queue.shift()!;
            const children = currentMapData.filter(n => n.parentId === currentId);
            children.forEach(child => {
              descendants.add(child.id);
              queue.push(child.id);
            });
          }
          return descendants;
        };
        return getDescendants(potentialParentId).has(childId);
      };

      // 检查是否会形成循环（目标节点是否是被拖动节点的后代）
      if (checkIsDescendant(nodeId, targetNodeId, currentMapData)) {
        setNodes(prevNodes => prevNodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            isBeingDragged: false,
          }
        })));
        return;
      }

      // 获取移动前的父节点（完整数据结构）
      const oldParentId = draggedNodeParentId;
      const oldParentNode = oldParentId ? currentMapData.find(n => n.id === oldParentId) : null;

      // 二、修改MindNodeData数据：计算所有受影响节点的新层级
      const draggedNodeNewLevel = targetNode.level + 1;
      const nodeLevelMap = new Map<string, number>();
      nodeLevelMap.set(nodeId, draggedNodeNewLevel);

      // 使用广度优先搜索计算所有子节点的新层级
      const queue: Array<{ id: string; level: number }> = [{id: nodeId, level: draggedNodeNewLevel}];
      while (queue.length > 0) {
        const {id: parentId, level: parentLevel} = queue.shift()!;
        const children = currentMapData.filter(n => n.parentId === parentId);
        children.forEach(child => {
          const newLevel = parentLevel + 1;
          nodeLevelMap.set(child.id, newLevel);
          queue.push({id: child.id, level: newLevel});
        });
      }

      // 应用所有更新（只更新 parentId 和 level，其他数据保持不变）
      const updatedMapData = currentMapData.map(node => {
        if (node.id === nodeId) {
          // 更新被拖动节点：修改 parentId 和 level
          return {...node, parentId: targetNodeId, level: draggedNodeNewLevel};
        }
        if (nodeLevelMap.has(node.id)) {
          // 更新被拖动节点的所有子节点：只修改 level
          return {...node, level: nodeLevelMap.get(node.id)!};
        }
        return node;
      });

      // 验证更新后的数据
      const updatedDraggedNode = updatedMapData.find(n => n.id === nodeId);
      if (!updatedDraggedNode || updatedDraggedNode.parentId !== targetNodeId) {
        setNodes(prevNodes => prevNodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            isBeingDragged: false,
          }
        })));
        return;
      }

      // 获取移动后的父节点（完整数据结构）
      const newParentId = updatedDraggedNode.parentId === '000000' ? null : (updatedDraggedNode.parentId || null);
      const newParentNode = newParentId ? updatedMapData.find(n => n.id === newParentId) : null;

      // 三、先更新 mapDataRef.current（确保数据源是最新的）
      mapDataRef.current = updatedMapData;

      // 清除被拖动节点及其子节点的半透明效果
      setNodes(prevNodes => prevNodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          isBeingDragged: false,
        }
      })));

      // 四、重新计算布局并渲染
      // 使用 ref 中的最新版本，避免闭包问题
      // processMapDataAndRender 会从 mapDataRef.current 读取数据，但我们传入 updatedMapData 确保一致性
      const renderFn = processMapDataAndRenderRef.current;
      if (renderFn) {
        renderFn(updatedMapData);
      } else {
        // 降级方案：直接调用（可能使用旧版本，但应该能工作）
        processMapDataAndRender(updatedMapData);
      }

      // 五、触发保存（节点拖动位置）
      handleSaveRef.current?.('node');
    };

    // 监听节点编辑状态变化
    const handleNodeEditStateChange = (e: CustomEvent) => {
      const {nodeId, isEditing} = e.detail;
      if (isEditing) {
        editingNodesRef.current.add(nodeId);
      } else {
        editingNodesRef.current.delete(nodeId);
      }
      setHasEditingNode(editingNodesRef.current.size > 0);
    };

    window.addEventListener('dragNodeStart', handleDragNodeStart as EventListener);
    window.addEventListener('dragNodeMove', handleDragNodeMove as EventListener);
    window.addEventListener('dragNodeEnd', handleDragNodeEnd as EventListener);
    window.addEventListener('nodeEditStateChange', handleNodeEditStateChange as EventListener);

    return () => {
      window.removeEventListener('dragNodeStart', handleDragNodeStart as EventListener);
      window.removeEventListener('dragNodeMove', handleDragNodeMove as EventListener);
      window.removeEventListener('dragNodeEnd', handleDragNodeEnd as EventListener);
      window.removeEventListener('nodeEditStateChange', handleNodeEditStateChange as EventListener);
    };
  }, []); // 不需要依赖，因为 handleDragNodeEnd 中使用 mapDataRef 和 processMapDataAndRenderRef 获取最新的数据和函数

  // 组件卸载时清理 viewport 变化的防抖定时器
  useEffect(() => {
    return () => {
      if (viewportChangeTimeoutRef.current) {
        clearTimeout(viewportChangeTimeoutRef.current);
      }
    };
  }, []);

  // viewport 变化的防抖处理（用于画布移动、缩放）
  const viewportChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 保存方法：将当前 mapData 和 viewport 保存
  // changeType: 'node' - 节点变化（新增、删除、内容改变、拖动位置）
  //           'viewport' - 画布变化（移动、缩放）
  const handleSave = useCallback((changeType: 'node' | 'viewport') => {
    if (changeType === 'node') {
      // 节点变化时的保存逻辑
      onSave?.({
        layout: null,
        data: mapDataRef.current
      });
    } else if (changeType === 'viewport') {
      onSave?.({
        layout: viewportRef.current,
        data: null
      });
    }
  }, [onSave]);

  // 同步更新 handleSaveRef
  handleSaveRef.current = handleSave;

  return (
      <div style={{height: height, width: width, position: 'relative'}}>

        {/* 控制按钮 */}
        <div
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              border: '1px solid #ddd',
              borderRadius: '4px',
              background: 'rgba(225, 225, 225, 0.5)',
              boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
              zIndex: 10
            }}
        >
          <IconButton
              icon={'reload'}
              onClick={() => {
                // 基于当前 mapDataRef 重新计算尺寸与布局并渲染
                processMapDataAndRender();
              }}
              bordered={false}
              size={28}
          />
        </div>

        <ReactFlow
            onInit={onInit}
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            nodeTypes={{topic: TopicNode}}
            edgeTypes={{roundedstep: RoundedStepEdge, firststep: FirstStepEdge}}
            style={{backgroundColor: '#fff'}}
            fitView={false}
            attributionPosition="bottom-left"
            elementsSelectable={true}
            selectNodesOnDrag={false}
            deleteKeyCode={null} // 禁用ReactFlow内置的删除功能
            panOnDrag={!hasEditingNode} // 当有节点处于可编辑状态时，禁用画板拖动
            panOnScroll={true} // 禁用滚轮平移
            zoomOnScroll={true} // 禁用滚轮缩放
            zoomOnDoubleClick={false} // 禁止画板响应双击
            preventScrolling={false} // 允许页面滚动
            nodesDraggable={false} // 禁止节点拖拽
            nodesConnectable={false} // 禁用节点连接

            defaultEdgeOptions={{
              style: {stroke: '#1890ff', strokeWidth: 1.5, pointerEvents: 'none'},
              type: 'roundedstep',
              animated: false,
              selectable: false,
              deletable: false,
              focusable: false,
            }}
            onPaneClick={() => {
            }} // 禁用画板点击事件
            onPaneContextMenu={() => {
            }} // 禁用画板右键菜单
            onEdgesChange={() => {
            }}
            onConnect={() => {
            }}
            onEdgeClick={() => {
            }}
            onEdgeDoubleClick={() => {
            }}
            onEdgeMouseEnter={() => {
            }}
            onEdgeMouseLeave={() => {
            }}
            onEdgeMouseMove={() => {
            }}
            onEdgeContextMenu={() => {
            }}

            defaultViewport={{
              x: viewportRef.current.x,
              y: viewportRef.current.y,
              zoom: viewportRef.current.zoom
            }}
            onViewportChange={(viewport) => {
              // 更新 viewportRef
              viewportRef.current = {
                x: viewport.x,
                y: viewport.y,
                zoom: viewport.zoom
              };
              // 画布移动、缩放时触发保存（使用防抖，避免频繁保存）
              if (viewportChangeTimeoutRef.current) {
                clearTimeout(viewportChangeTimeoutRef.current);
              }
              viewportChangeTimeoutRef.current = setTimeout(() => {
                handleSaveRef.current?.('viewport');
              }, 300); // 300ms 防抖
            }}
        >
          <MindFlowWithZoom>
            <Controls showInteractive={false}/>
          </MindFlowWithZoom>
        </ReactFlow>
      </div>
  );
};

export default MindEditor;
