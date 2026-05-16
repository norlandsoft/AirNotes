import {MindNodeData} from '../data/MindData';

/**
 * 思维导图布局计算工具
 * 实现根节点居中、左右两侧放射分布的树状布局
 * 每个节点的子节点垂直排列，中心对齐父节点
 */

/**
 * 布局配置参数接口
 */
export interface LayoutConfig {
  /** 不同层级之间的水平间距（固定值） */
  rankSpacing: number;
  /** 根节点到第一级节点的水平间距（固定值） */
  rootLevelSpacing: number;
  /** 基础节点间距（同层节点最小垂直间距，会根据子树高度自适应调整） */
  baseNodeSpacing: number;
  /** 一级节点分布模式：'bidirectional' 全向放射（左右分布），'unidirectional' 单向（仅右侧） */
  firstLevelMode: 'bidirectional' | 'unidirectional';
}

/**
 * 默认布局配置参数
 */
const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  rankSpacing: 50, // 固定层级间距
  rootLevelSpacing: 120, // 根节点到第一级节点的水平间距
  baseNodeSpacing: 8, // 基础节点间距
  firstLevelMode: 'unidirectional', // 单向分布（仅右侧）
};

/**
 * 当前使用的布局配置（可通过setLayoutConfig更新）
 */
let LAYOUT_CONFIG: LayoutConfig = {...DEFAULT_LAYOUT_CONFIG};

/**
 * 设置布局配置
 * @param config 布局配置（部分配置，会与默认配置合并）
 */
export const setLayoutConfig = (config: Partial<LayoutConfig>): void => {
  LAYOUT_CONFIG = {...DEFAULT_LAYOUT_CONFIG, ...config};
};

/**
 * 节点位置信息接口
 */
interface NodePosition {
  id: string;
  x: number;
  y: number;        // 左上角Y坐标
  ym: number;       // 中心Y坐标
  subtreeHeight: number; // 子树总高度（用于验证）
}

/**
 * 子树高度信息接口（第一阶段计算结果）
 */
interface SubtreeInfo {
  height: number;    // 子树总高度（包括所有后代和间距）
  nodeHeight: number; // 节点自身高度
}

/**
 * 计算思维导图布局
 * 实现根节点居中、左右两侧放射分布的树状布局
 *
 * X坐标计算逻辑：
 * - Level 0: X = 0
 * - Level N: X = Level(N-1)的X + Level(N-1)的levelMaxWidth值 + 固定间距(rankSpacing)
 *
 * 算法步骤：
 * 1. 递归计算每个子树的高度（后序遍历）
 * 2. 计算每个层级的最宽节点宽度（基于节点实际内容宽度）
 * 3. 根据层级宽度和固定间距计算每一层级的X坐标
 * 4. 根据子树高度分配每个子节点的Y坐标（前序遍历）
 * 5. 根节点居中，左、右子树分别从中心向两侧扩展
 * 6. 整体居中显示在画布中
 *
 * @param mapData 处理后的节点数据（包含height、width）
 * @returns 包含位置信息的节点数据数组
 */
export const calculateMindMapLayout = (mapData: MindNodeData[]): MindNodeData[] => {
  if (!mapData || mapData.length === 0) {
    return [];
  }

  // 1. 查找根节点
  const rootNode = mapData.find(node => node.level === 0);
  if (!rootNode) {
    return mapData;
  }

  // 2. 构建树形结构
  const {nodeChildren} = buildTreeStructure(mapData);

  // 3. 第一阶段：递归计算每个子树的高度（后序遍历）
  const subtreeHeights = calculateSubtreeHeights(
      rootNode.id,
      mapData,
      nodeChildren
  );

  // 3.5. 计算每一层级的最宽节点宽度，并构建层级X坐标映射
  const levelMaxWidths = calculateLevelMaxWidths(mapData);
  const levelXCoordinates = calculateLevelXCoordinates(levelMaxWidths);

  // 4. 第二阶段：根据子树高度分配节点位置（前序遍历）
  const nodePositions = new Map<string, NodePosition>();
  const rootWidth = levelMaxWidths.get(0) ?? rootNode.width ?? 120;
  const rootHeight = rootNode.height ?? 40;

  // 根节点位置（临时设为层级X坐标，后续会整体居中）
  const rootX = levelXCoordinates.get(0) ?? 0;
  nodePositions.set(rootNode.id, {
    id: rootNode.id,
    x: rootX,
    y: -rootHeight / 2,
    ym: 0,
    subtreeHeight: subtreeHeights.get(rootNode.id)?.height ?? rootHeight
  });

  // 计算一级子节点的分布
  const firstLevelChildren = nodeChildren.get(rootNode.id) || [];
  if (firstLevelChildren.length > 0) {
    if (LAYOUT_CONFIG.firstLevelMode === 'bidirectional') {
      // 全向放射：左右分布
      distributeFirstLevelBidirectional(
          rootNode.id,
          0, // 根节点中心Y
          rootX + rootWidth / 2, // 根节点右边界（基于层级宽度）
          firstLevelChildren,
          mapData,
          nodeChildren,
          subtreeHeights,
          nodePositions,
          levelMaxWidths,
          levelXCoordinates,
          true // 右侧
      );

      distributeFirstLevelBidirectional(
          rootNode.id,
          0, // 根节点中心Y
          rootX - rootWidth / 2, // 根节点左边界（基于层级宽度）
          firstLevelChildren,
          mapData,
          nodeChildren,
          subtreeHeights,
          nodePositions,
          levelMaxWidths,
          levelXCoordinates,
          false // 左侧
      );
    } else {
      // 单向：仅右侧分布
      distributeChildren(
          rootNode.id,
          0, // 父节点中心Y
          rootX + rootWidth / 2, // 父节点右边界（基于层级宽度）
          firstLevelChildren,
          mapData,
          nodeChildren,
          subtreeHeights,
          nodePositions,
          levelMaxWidths,
          levelXCoordinates,
          1 // 当前层级
      );
    }
  }

  // 4.5 子阶段：基于子节点重新对齐每个父节点的Y（非叶子）：
  // y = (最上子节点中心Y + 最下子节点中心Y) / 2 - 自身高度/2
  // ym = (最上子节点中心Y + 最下子节点中心Y) / 2
  realignParentsY(mapData, nodeChildren, nodePositions);

  // 5. 整体居中：计算所有节点的边界，然后调整偏移量
  const bounds = calculateBounds(nodePositions, mapData);
  const offsetX = -bounds.centerX;
  const offsetY = -bounds.centerY;

  // 应用偏移量，使整体居中
  nodePositions.forEach(position => {
    position.x += offsetX;
    position.y += offsetY;
    position.ym += offsetY;
  });

  // 6. 应用位置到原始数据
  const positionedData = applyPositionsToMapData(mapData, nodePositions);

  // 7. 只返回有位置信息的节点
  // 因为：
  // - 所有父节点都会参与布局计算，有位置信息
  // - 所以只需检查是否有位置信息，就能正确过滤出可见节点
  return positionedData.filter(node => nodePositions.has(node.id));
};

/**
 * 构建完整树形结构
 * 构建所有节点的父子关系映射
 *
 * @param mapData 节点数据
 * @returns 子节点映射（包含所有子节点，不过滤）
 */
const buildTreeStructure = (mapData: MindNodeData[]) => {
  const nodeChildren = new Map<string, MindNodeData[]>();

  // 为每个节点构建完整的子节点列表
  mapData.forEach(node => {
    const children = mapData.filter(child => child.parentId === node.id);
    nodeChildren.set(node.id, children);
  });

  return {nodeChildren};
};

/**
 * 第一阶段：递归计算每个子树的高度（后序遍历，自底向上）
 * 子树高度 = 节点自身高度 + 所有子节点子树高度之和 + 节点间距
 *
 * @param nodeId 当前节点ID
 * @param mapData 节点数据
 * @param nodeChildren 子节点映射
 * @returns 子树高度映射（nodeId -> SubtreeInfo）
 */
const calculateSubtreeHeights = (
    nodeId: string,
    mapData: MindNodeData[],
    nodeChildren: Map<string, MindNodeData[]>
): Map<string, SubtreeInfo> => {
  const subtreeHeights = new Map<string, SubtreeInfo>();
  const nodeMap = new Map<string, MindNodeData>();
  mapData.forEach(node => nodeMap.set(node.id, node));

  /**
   * 递归计算子树高度的内部函数
   */
  const calculateHeight = (currentId: string): SubtreeInfo => {
    // 如果已经计算过，直接返回
    if (subtreeHeights.has(currentId)) {
      return subtreeHeights.get(currentId)!;
    }

    const node = nodeMap.get(currentId);
    if (!node) {
      return {height: 40, nodeHeight: 40};
    }

    // 获取节点自身高度
    const nodeHeight = node.height ?? 40;
    const children = nodeChildren.get(currentId) || [];

    // 叶子节点：子树高度=节点自身高度
    if (children.length === 0) {
      const info: SubtreeInfo = {height: nodeHeight, nodeHeight};
      subtreeHeights.set(currentId, info);
      return info;
    }

    // 非叶子节点：先递归计算所有子节点的子树高度
    let totalChildrenHeight = 0;
    children.forEach(child => {
      const childInfo = calculateHeight(child.id);
      totalChildrenHeight += childInfo.height; // 子节点的子树高度（已包括子节点自身高度）
    });

    // 计算子节点之间的总间距
    // 根节点（level 0）与一级节点（level 1）之间采用固定间距 32；
    // 其他层级根据子树高度自适应调整
    const isRoot = (node.level === 0);
    const spacing = children.length > 0
        ? (isRoot ? 32 : Math.max(LAYOUT_CONFIG.baseNodeSpacing, LAYOUT_CONFIG.baseNodeSpacing * (1 + totalChildrenHeight / 1000)))
        : 0;
    const totalSpacing = (children.length - 1) * spacing;

    // 子树总高度 = max(节点自身高度, 所有子节点子树高度总和 + 间距)
    // 子树高度包括节点自身高度，用于布局时计算父节点的垂直居中
    const totalHeight = Math.max(nodeHeight, totalChildrenHeight + totalSpacing);

    const info: SubtreeInfo = {height: totalHeight, nodeHeight};
    subtreeHeights.set(currentId, info);
    return info;
  };

  // 从根节点开始计算
  calculateHeight(nodeId);
  return subtreeHeights;
};

/**
 * 计算节点的实际尺寸
 * 直接使用节点的实际宽度和高度（从节点数据中获取）
 */
const getNodeSize = (node: MindNodeData): { width: number; height: number } => {
  return {
    width: node.width ?? 120,
    height: node.height ?? 40,
  };
};

/**
 * 计算每一层级的最宽节点宽度（levelMaxWidth值）
 * 如果节点数据中已包含 levelMaxWidth 属性，直接使用；否则重新计算
 *
 * @param mapData 节点数据（应已包含计算后的width、height和levelMaxWidth）
 * @returns 层级到levelMaxWidth的映射（每个层级的levelMaxWidth = 该层级中最宽节点的实际宽度）
 */
const calculateLevelMaxWidths = (mapData: MindNodeData[]): Map<number, number> => {
  const levelMaxWidths = new Map<number, number>();

  mapData.forEach(node => {
    const level = node.level;
    // 优先使用节点数据中已计算的 levelMaxWidth 属性（由 processMapData 计算）
    // 如果没有，则使用节点的实际宽度进行重新计算
    const nodeLevelMaxWidth = node.levelMaxWidth ?? node.width ?? 120;
    const currentMax = levelMaxWidths.get(level) ?? 0;

    if (nodeLevelMaxWidth > currentMax) {
      levelMaxWidths.set(level, nodeLevelMaxWidth);
    }
  });

  return levelMaxWidths;
};


/**
 * 计算每一层级的X坐标位置
 * 核心公式：当前层级X坐标 = 上一层级X坐标 + 上一层级levelMaxWidth值 + 固定间距
 *
 * 每个层级的X坐标从左到右累积计算：
 * - Level 0: X = 0
 * - Level 1: X = Level0的X + Level0的levelMaxWidth值 + 固定间距(rankSpacing)
 * - Level 2: X = Level1的X + Level1的levelMaxWidth值 + 固定间距(rankSpacing)
 * - ...
 *
 * @param levelMaxWidths 层级到levelMaxWidth的映射（每个层级的levelMaxWidth = 该层级中最宽节点的实际宽度）
 * @returns 层级到X坐标的映射（X坐标为该层级节点的左上角X坐标）
 */
const calculateLevelXCoordinates = (levelMaxWidths: Map<number, number>): Map<number, number> => {
  const levelXCoordinates = new Map<number, number>();
  const levels = Array.from(levelMaxWidths.keys()).sort((a, b) => a - b);

  if (levels.length === 0) return levelXCoordinates;

  // Level 0 的X坐标从0开始（后续会整体居中）
  levelXCoordinates.set(0, 0);

  // 固定的层级间距；根->一级采用更大的间距
  const spacing = LAYOUT_CONFIG.rankSpacing;
  const rootToFirstLevelSpacing = LAYOUT_CONFIG.rootLevelSpacing; // Level 0 到 Level 1 的特殊水平间距

  // 从Level 1开始，逐层计算X坐标
  let currentX = 0;
  for (let i = 1; i < levels.length; i++) {
    const prevLevel = levels[i - 1];
    const currentLevel = levels[i];

    // 获取上一层级的levelMaxWidth值（该层级中最宽节点的实际宽度）
    const prevLevelWidth = levelMaxWidths.get(prevLevel) ?? 120;

    // 根->一级使用更大的间距，其它层级使用默认间距
    const gap = (prevLevel === 0 && currentLevel === 1) ? rootToFirstLevelSpacing : spacing;

    // 核心公式：当前层级X坐标 = 上一层级X坐标 + 上一层级levelMaxWidth值 + 间距
    currentX = currentX + prevLevelWidth + gap;
    levelXCoordinates.set(currentLevel, currentX);
  }

  return levelXCoordinates;
};


/**
 * 第二阶段：分配一级节点的左右分布（全向放射模式）
 * 将一级节点分成左右两组，分别从根节点中心向两侧扩展
 *
 * @param parentId 父节点（根节点）ID
 * @param parentCenterY 父节点中心Y坐标
 * @param parentBoundaryX 父节点边界X坐标（右边界为正，左边界为负）
 * @param children 所有一级子节点
 * @param mapData 节点数据
 * @param nodeChildren 子节点映射
 * @param subtreeHeights 子树高度映射
 * @param nodePositions 位置映射（输出）
 * @param levelMaxWidths 层级最大宽度映射
 * @param levelXCoordinates 层级X坐标映射
 * @param isRight 是否为右侧（true=右侧，false=左侧）
 */
const distributeFirstLevelBidirectional = (
    parentId: string,
    parentCenterY: number,
    parentBoundaryX: number,
    children: MindNodeData[],
    mapData: MindNodeData[],
    nodeChildren: Map<string, MindNodeData[]>,
    subtreeHeights: Map<string, SubtreeInfo>,
    nodePositions: Map<string, NodePosition>,
    levelMaxWidths: Map<number, number>,
    levelXCoordinates: Map<number, number>,
    isRight: boolean
): void => {
  // 将一级节点分成两组：左右各一半
  const midIndex = Math.ceil(children.length / 2);
  const targetChildren = isRight
      ? children.slice(0, midIndex)  // 右侧：前半部分
      : children.slice(midIndex);    // 左侧：后半部分

  if (targetChildren.length === 0) return;

  // 计算目标节点的子树高度总和
  let totalSubtreeHeight = 0;
  targetChildren.forEach(child => {
    const info = subtreeHeights.get(child.id);
    totalSubtreeHeight += info?.height ?? 40;
  });

  // 计算节点间距：一级节点固定 32
  const spacing = 32;
  const totalSpacing = (targetChildren.length - 1) * spacing;

  // 从父节点中心开始，向上分配空间（垂直居中）
  let currentY = parentCenterY - (totalSubtreeHeight + totalSpacing) / 2;

  // 计算子节点的X位置（使用层级X坐标，确保同一层级的节点X坐标对齐）
  const childLevel = targetChildren[0]?.level ?? 1;
  const childLevelX = levelXCoordinates.get(childLevel) ?? 0;
  const childX = childLevelX;

  // 为每个目标子节点分配位置
  targetChildren.forEach((child, index) => {
    const size = getNodeSize(child);
    const subtreeInfo = subtreeHeights.get(child.id);
    const subtreeHeight = subtreeInfo?.height ?? size.height;

    // 子节点中心Y位置（在整个子树区域的中心）
    // 子树高度已包括节点自身高度，所以直接除以2即可
    const childCenterY = currentY + subtreeHeight / 2;

    // 保存子节点位置（使用层级X坐标，确保对齐）
    nodePositions.set(child.id, {
      id: child.id,
      x: childX,
      y: childCenterY - size.height / 2, // 节点左上角 = 中心Y - 节点自身高度/2
      ym: childCenterY,
      subtreeHeight
    });

    // 递归分配子节点的子节点位置
    const childChildren = nodeChildren.get(child.id) || [];
    if (childChildren.length > 0) {
      distributeChildren(
          child.id,
          childCenterY,
          childX, // 使用层级X坐标，不依赖父节点宽度
          childChildren,
          mapData,
          nodeChildren,
          subtreeHeights,
          nodePositions,
          levelMaxWidths,
          levelXCoordinates,
          childLevel + 1, // 下一层级
          isRight
      );
    }

    // 移动到下一个子节点的位置
    // 关键修复：对于最后一个节点，不需要添加 spacing（因为没有下一个节点了）
    if (index < targetChildren.length - 1) {
      // 不是最后一个节点，需要加上间距
      currentY += subtreeHeight + spacing;
    } else {
      // 最后一个节点，只需要加上子树高度（不需要加间距）
      currentY += subtreeHeight;
    }
  });
};

/**
 * 第二阶段：递归分配子节点位置（前序遍历，自顶向下）
 * 每个节点的子节点垂直排列，中心对齐父节点
 * 使用层级X坐标，确保同一层级的节点X坐标对齐
 *
 * @param parentId 父节点ID
 * @param parentCenterY 父节点中心Y坐标
 * @param parentX 父节点X坐标（用于判断方向，但不用于计算子节点X坐标）
 * @param children 子节点数组
 * @param mapData 节点数据
 * @param nodeChildren 子节点映射
 * @param subtreeHeights 子树高度映射
 * @param nodePositions 位置映射（输出）
 * @param levelMaxWidths 层级最大宽度映射
 * @param levelXCoordinates 层级X坐标映射
 * @param level 子节点的层级
 * @param directionRight 是否为向右扩展（从根节点开始传递）
 */
const distributeChildren = (
    parentId: string,
    parentCenterY: number,
    parentX: number,
    children: MindNodeData[],
    mapData: MindNodeData[],
    nodeChildren: Map<string, MindNodeData[]>,
    subtreeHeights: Map<string, SubtreeInfo>,
    nodePositions: Map<string, NodePosition>,
    levelMaxWidths: Map<number, number>,
    levelXCoordinates: Map<number, number>,
    level: number,
    directionRight: boolean = true
): void => {
  if (children.length === 0) return;

  // 计算所有子节点的子树高度总和
  let totalSubtreeHeight = 0;
  children.forEach(child => {
    const info = subtreeHeights.get(child.id);
    totalSubtreeHeight += info?.height ?? 40;
  });

  // 计算节点间距：当 level===1（一级节点）时固定 32，否则自适应
  const baseSpacing = LAYOUT_CONFIG.baseNodeSpacing;
  const spacing = level === 1
      ? 32
      : Math.max(baseSpacing, baseSpacing * (1 + totalSubtreeHeight / 1000));
  const totalSpacing = (children.length - 1) * spacing;

  // 从父节点中心开始，向上分配空间（垂直居中）
  let currentY = parentCenterY - (totalSubtreeHeight + totalSpacing) / 2;

  // 计算子节点的X位置（使用层级X坐标，确保同一层级的节点X坐标对齐）
  // 不再基于父节点宽度计算，而是直接从层级X坐标映射获取
  const childLevelX = levelXCoordinates.get(level) ?? 0;
  const childX = childLevelX;

  // 为每个子节点分配位置
  children.forEach((child, index) => {
    const size = getNodeSize(child);
    const subtreeInfo = subtreeHeights.get(child.id);
    // 关键修复：确保 subtreeHeight 使用正确的值
    // 对于叶子节点，subtreeHeight 应该等于节点自身高度
    // 对于非叶子节点，subtreeHeight 包括节点自身高度和子节点高度
    // 如果 subtreeInfo 不存在，使用节点自身高度（作为叶子节点处理）
    const subtreeHeight = subtreeInfo ? subtreeInfo.height : size.height;


    // 子节点中心Y位置（在整个子树区域的中心）
    // 子树高度已包括节点自身高度，所以直接除以2即可
    const childCenterY = currentY + subtreeHeight / 2;

    // 保存子节点位置（使用层级X坐标，确保对齐）
    nodePositions.set(child.id, {
      id: child.id,
      x: childX,
      y: childCenterY - size.height / 2, // 节点左上角 = 中心Y - 节点自身高度/2
      ym: childCenterY,
      subtreeHeight
    });

    // 递归分配子节点的子节点位置
    const childChildren = nodeChildren.get(child.id) || [];
    if (childChildren.length > 0) {
      distributeChildren(
          child.id,
          childCenterY,
          childX, // 传递子节点X坐标，用于方向判断
          childChildren,
          mapData,
          nodeChildren,
          subtreeHeights,
          nodePositions,
          levelMaxWidths,
          levelXCoordinates,
          level + 1, // 下一层级
          directionRight
      );
    }

    // 移动到下一个子节点的位置
    // 关键修复：确保相邻节点之间有足够的间距，避免重叠
    // currentY 是下一个节点子树区域的起始位置
    // 当前节点的子树区域结束位置 = currentY + subtreeHeight
    // 下一个节点的子树区域起始位置 = 当前节点子树区域结束位置 + spacing
    // 所以：nextCurrentY = currentY + subtreeHeight + spacing

    // 对于叶子节点：subtreeHeight = nodeHeight（节点自身高度）
    // 对于有子节点的节点：subtreeHeight >= nodeHeight（包括子节点高度）
    // 无论哪种情况，都需要 currentY += subtreeHeight + spacing

    if (index < children.length - 1) {
      // 不是最后一个节点，移动到下一个节点的位置（当前节点子树结束位置 + 间距）
      currentY += subtreeHeight + spacing;
    } else {
      // 最后一个节点，只需要移动到当前节点子树结束位置（不需要加间距，因为没有下一个节点）
      currentY += subtreeHeight;
    }
  });
};

/**
 * 计算所有节点的边界框，用于整体居中
 * @param nodePositions 节点位置映射
 * @param mapData 节点数据
 * @returns 边界信息
 */
const calculateBounds = (
    nodePositions: Map<string, NodePosition>,
    mapData: MindNodeData[]
): { minX: number; maxX: number; minY: number; maxY: number; centerX: number; centerY: number } => {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  const nodeMap = new Map<string, MindNodeData>();
  mapData.forEach(node => nodeMap.set(node.id, node));

  nodePositions.forEach((position, nodeId) => {
    const node = nodeMap.get(nodeId);
    const size = node ? getNodeSize(node) : {width: 120, height: 40};

    const left = position.x;
    const right = position.x + size.width;
    const top = position.y;
    const bottom = position.y + size.height;

    minX = Math.min(minX, left);
    maxX = Math.max(maxX, right);
    minY = Math.min(minY, top);
    maxY = Math.max(maxY, bottom);
  });

  return {
    minX,
    maxX,
    minY,
    maxY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2
  };
};

/**
 * 将位置信息应用到mapData
 * @param mapData 原始节点数据
 * @param nodePositions 位置映射
 * @returns 更新位置后的节点数据
 */
const applyPositionsToMapData = (
    mapData: MindNodeData[],
    nodePositions: Map<string, NodePosition>
): MindNodeData[] => {
  return mapData.map(node => {
    const position = nodePositions.get(node.id);
    if (position) {
      return {
        ...node,
        x: Math.round(position.x),
        y: Math.round(position.y),
        ym: Math.round(position.ym)
      };
    }
    return node;
  });
};

/**
 * 基于已计算的子节点位置，重新对齐父节点的Y坐标
 * - 若存在子节点：父节点中心Y = 所有直接子节点中心Y的上下边界中点
 * - 若无子节点：保持原有策略（不变）
 */
const realignParentsY = (
    mapData: MindNodeData[],
    nodeChildren: Map<string, MindNodeData[]>,
    nodePositions: Map<string, NodePosition>
): void => {
  // 为确保父节点在子节点之后处理，按层级从高到低（大到小）遍历
  const nodesByLevel = new Map<number, MindNodeData[]>();
  mapData.forEach(n => {
    if (!nodesByLevel.has(n.level)) nodesByLevel.set(n.level, []);
    nodesByLevel.get(n.level)!.push(n);
  });
  const levels = Array.from(nodesByLevel.keys()).sort((a, b) => b - a);

  levels.forEach(level => {
    const nodes = nodesByLevel.get(level) || [];
    nodes.forEach(node => {
      // 关键检查：确保父节点本身有位置信息
      const parentPos = nodePositions.get(node.id);
      if (!parentPos) {
        return;
      }

      const children = nodeChildren.get(node.id) || [];
      if (children.length === 0) return; // 叶子节点不处理

      // 获取有位置信息的子节点
      const childPositions = children
          .map(c => nodePositions.get(c.id))
          .filter((p): p is NodePosition => !!p);

      // 如果有可见的子节点，基于子节点重新对齐父节点
      if (childPositions.length > 0) {
        const minYm = Math.min(...childPositions.map(p => p.ym));
        const maxYm = Math.max(...childPositions.map(p => p.ym));
        const centerY = (minYm + maxYm) / 2;

        const size = getNodeSize(node);
        parentPos.ym = centerY;
        parentPos.y = centerY - size.height / 2;
      }
    });
  });
};

/**
 * 验证布局结果
 * 检查父节点是否垂直居中于子节点组
 * @param mapData 布局后的节点数据
 * @returns 验证结果
 */
export const validateLayout = (mapData: MindNodeData[]): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  mapData.forEach(node => {
    const children = mapData.filter(child => child.parentId === node.id);
    if (children.length === 0) return; // 叶子节点无需验证

    // 计算子节点组的中心Y（使用所有子节点的中心Y坐标范围）
    const childCenters = children.map(child => child.ym);
    if (childCenters.length === 0) return;

    const groupCenterY = (Math.min(...childCenters) + Math.max(...childCenters)) / 2;

    // 检查父节点中心Y是否与子节点组中心Y对齐
    const offset = Math.abs(node.ym - groupCenterY);
    if (offset > 1) { // 允许1px的误差
      errors.push(`节点 ${node.id} 未垂直居中，偏移量: ${offset.toFixed(2)}px`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * 获取布局统计信息
 * @param mapData 布局后的节点数据
 * @returns 布局统计信息
 */
export const getLayoutStats = (mapData: MindNodeData[]) => {
  const levels = new Map<number, number>();
  let maxLevel = 0;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  mapData.forEach(node => {
    const level = node.level;
    levels.set(level, (levels.get(level) || 0) + 1);
    maxLevel = Math.max(maxLevel, level);

    // 计算边界框
    if (node.x !== undefined) {
      const nodeWidth = node.width ?? 120;
      minX = Math.min(minX, node.x);
      maxX = Math.max(maxX, node.x + nodeWidth);
    }
    if (node.y !== undefined) {
      const nodeHeight = node.height ?? 40;
      minY = Math.min(minY, node.y);
      maxY = Math.max(maxY, node.y + nodeHeight);
    }
  });

  return {
    totalNodes: mapData.length,
    maxLevel,
    levels: Object.fromEntries(levels),
    canvasSize: {
      width: maxX - minX,
      height: maxY - minY
    },
    bounds: {
      minX,
      maxX,
      minY,
      maxY,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2
    }
  };
};
