import {MindNodeData} from '../data/MindData';

/**
 * 隐藏测量容器（与 TopicNode 样式一致）
 * 在浏览器环境下创建一次复用，用于精确测量文本真实渲染后的宽高
 */
let measurementContainer: HTMLDivElement | null = null;

/**
 * 获取测量元素（按层级设置与 TopicNode 相同的样式）
 */
const ensureMeasurementElement = (level: number): HTMLDivElement | null => {
  if (typeof document === 'undefined') return null;
  if (!measurementContainer) {
    const div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.left = '-10000px';
    div.style.top = '-10000px';
    div.style.visibility = 'hidden';
    // whiteSpace 会在测量时根据需要动态设置（nowrap 或 normal）
    div.style.whiteSpace = 'nowrap'; // 默认使用 nowrap
    div.style.margin = '0';
    div.style.outline = 'none';
    div.style.fontFamily = 'inherit';
    document.body.appendChild(div);
    measurementContainer = div;
  }

  // 按照 TopicNode.getLevelStyle 对齐关键排版参数
  // 统一使用 border-box，确保测量结果与实际渲染一致
  if (measurementContainer) {
    measurementContainer.style.boxSizing = 'border-box';

    if (level === 0) {
      measurementContainer.style.backgroundColor = '#222';
      measurementContainer.style.color = '#fff';
      measurementContainer.style.fontSize = '18px';
      measurementContainer.style.fontWeight = '600';
      measurementContainer.style.padding = '16px';
      measurementContainer.style.lineHeight = '20px';
      measurementContainer.style.border = '1px solid #fff';
      measurementContainer.style.borderRadius = '8px';
    } else if (level === 1) {
      measurementContainer.style.backgroundColor = '#ff6b6b';
      measurementContainer.style.color = '#fff';
      measurementContainer.style.fontSize = '16px';
      measurementContainer.style.fontWeight = '500';
      measurementContainer.style.padding = '8px';
      measurementContainer.style.lineHeight = '20px';
      measurementContainer.style.border = '1px solid #ff6b6b';
      measurementContainer.style.borderRadius = '4px';
    } else {
      measurementContainer.style.backgroundColor = '#dbe6f1';
      measurementContainer.style.color = '#222';
      measurementContainer.style.fontSize = '13px';
      measurementContainer.style.fontWeight = '450' as any;
      measurementContainer.style.padding = '4px 8px';
      measurementContainer.style.lineHeight = '18px';
      measurementContainer.style.border = '1px solid transparent';
      measurementContainer.style.borderRadius = '4px';
    }
  }

  measurementContainer.style.outline = 'none';
  measurementContainer.style.fontFamily = 'var(--font-family-code)';
  // 确保字符间距和文本渲染属性与实际渲染一致，特别是中英文混排场景
  measurementContainer.style.letterSpacing = 'normal';
  measurementContainer.style.textRendering = 'auto';
  // 确保文本方向一致
  measurementContainer.style.direction = 'ltr';
  measurementContainer.style.unicodeBidi = 'normal';

  return measurementContainer;
};

// 已移除旧的 measureNodeWidth（请使用 measureNodeSize）

/**
 * 思维导图数据处理工具
 * 提供节点尺寸计算、层级处理等功能
 */

/**
 * 使用隐藏容器测量节点真实高度
 * 注意：对于多行文本，需要先设置正确的宽度和换行方式，才能准确测量高度
 *
 // 已移除旧的 measureNodeHeight（请使用 measureNodeSize）

 /**
 * 计算单个节点的实际高度
 * 根据节点层级和内容确定节点高度
 *
 * @param nodeData 节点数据
 * @param nodeWidth 节点宽度（可选，如果未提供则先计算宽度）
 * @returns 节点高度
 */
// 已移除旧的 calculateNodeHeight（calculateSingleNodeData 兜底估算）

/**
 * 宽度冗余量（像素）
 * 中英文混排时，测量容器与实际节点渲染存在字体度量/亚像素等差异，易导致换行不一致。
 * 在测量宽度上预留冗余，避免节点内文字被错误换行。
 */
const WIDTH_REDUNDANCY_PX = 16;

/**
 * 一次性测量节点的显示宽度与真实高度
 * 设计目标：
 * 1. 先计算显示宽度（受 min/max 约束，模拟 TopicNode 单行/多行策略）
 * 2. 测量宽度会加上 WIDTH_REDUNDANCY_PX 冗余，缓解中英混排时宽度计算偏差导致的换行问题
 * 3. 立刻基于该宽度设置换行策略，测量实际渲染高度
 * 4. 最后清理测量容器状态，返回 { width, height }
 *
 * 非浏览器环境：返回 null，由调用方采用既有兜底策略
 */
const measureNodeSize = (
    value: string,
    level: number
): { width: number; height: number } | null => {
  const el = ensureMeasurementElement(level);
  if (!el) return null;

  const minWidth = 60;
  const maxWidth = 300;

  // 记录必要的原始样式，确保测量后恢复，避免串扰
  const original = {
    width: el.style.width,
    whiteSpace: el.style.whiteSpace,
    wordWrap: el.style.wordWrap,
    display: el.style.display,
    text: el.textContent || ''
  };

  try {
    // 1) 计算显示宽度（使用 border-box，offsetWidth 已包含 padding 和 border）
    el.style.width = '';
    el.style.boxSizing = 'border-box'; // 确保测量时使用 border-box
    let displayWidth: number = minWidth;

    if (!value || value.trim() === '') {
      displayWidth = minWidth;
    } else {
      const hasLineBreaks = value.includes('\n');

      if (hasLineBreaks) {
        // 有显式换行：测量每行的宽度，取最大值
        let maxLineWidth = 0;
        const lines = value.split('\n');
        el.style.whiteSpace = 'nowrap';
        el.style.display = 'block';
        for (const line of lines) {
          if (line.trim() === '') continue;
          el.textContent = line;
          // 触发布局，获取包含 padding 和 border 的总宽度
          void el.offsetWidth;
          const w = el.offsetWidth;
          if (w > maxLineWidth) maxLineWidth = w;
        }
        // 为宽度预留冗余，缓解中英混排时测量与实际渲染偏差导致的换行
        displayWidth = Math.max(minWidth, Math.min(maxWidth, maxLineWidth + WIDTH_REDUNDANCY_PX));
      } else {
        // 无显式换行：按单行宽度测量
        el.style.whiteSpace = 'nowrap';
        el.style.display = 'block';
        el.textContent = value;
        void el.offsetWidth;
        const raw = el.offsetWidth;
        // 为宽度预留冗余，缓解中英混排时测量与实际渲染偏差导致的换行
        displayWidth = Math.max(minWidth, Math.min(maxWidth, raw + WIDTH_REDUNDANCY_PX));
      }
    }

    // 2) 基于显示宽度测量真实高度
    // 使用 border-box，设置的宽度就是总宽度（包含 padding 和 border）
    const clampedWidth = Math.max(minWidth, Math.min(maxWidth, displayWidth));
    el.style.width = `${clampedWidth}px`;
    el.style.boxSizing = 'border-box'; // 确保高度测量时也使用 border-box

    const hasLineBreaksForHeight = (value || '').includes('\n');
    if (hasLineBreaksForHeight) {
      // 仅当包含显式换行时，使用 pre-wrap 以复现换行
      el.style.whiteSpace = 'pre-wrap';
      el.style.wordWrap = 'break-word';
      el.style.overflowWrap = 'break-word';
    } else {
      // 否则使用 normal，确保与实际容器自动换行策略一致
      el.style.whiteSpace = 'normal';
      el.style.wordWrap = 'break-word';
      el.style.overflowWrap = 'break-word';
    }

    // 确保字体设置与实际渲染完全一致，特别是中英文混排场景
    el.style.fontFamily = 'var(--font-family-code)';
    el.style.letterSpacing = 'normal'; // 确保字符间距一致
    el.style.textRendering = 'auto'; // 确保文本渲染方式一致
    el.style.direction = 'ltr'; // 确保文本方向一致
    el.style.unicodeBidi = 'normal'; // 确保双向文本处理一致

    el.textContent = value || '';
    el.style.display = 'block';

    // 触发布局，确保字体已加载并渲染
    // 对于中英文混排，需要多次触发以确保准确测量
    void el.offsetWidth;
    void el.offsetHeight;
    void el.scrollHeight; // 触发滚动高度计算，确保内容完全渲染

    // 获取高度，优先使用 scrollHeight（更准确，包含所有内容）
    // 如果 scrollHeight 不可用，则使用 offsetHeight
    let measuredHeight = el.scrollHeight || el.offsetHeight;

    // 如果高度异常小，可能是字体未加载完成或测量不准确，进行二次测量
    if (measuredHeight < 10 && value && value.trim()) {
      // 强制重新计算布局
      el.style.display = 'none';
      void el.offsetHeight;
      el.style.display = 'block';
      void el.offsetWidth;
      void el.offsetHeight;
      void el.scrollHeight;
      measuredHeight = el.scrollHeight || el.offsetHeight;
    }

    // 确保高度至少包含一行文本的高度（基于 lineHeight）
    const lineHeight = parseFloat(el.style.lineHeight) ||
        (level === 0 ? 20 : level === 1 ? 20 : 18);
    if (measuredHeight < lineHeight && value && value.trim()) {
      measuredHeight = lineHeight;
    }

    return {width: clampedWidth, height: measuredHeight};
  } finally {
    // 3) 恢复原始样式，避免对后续测量或页面造成影响
    el.textContent = original.text;
    el.style.width = original.width;
    el.style.whiteSpace = original.whiteSpace;
    el.style.wordWrap = original.wordWrap;
    el.style.display = original.display;
  }
};

/**
 * 测量节点原始宽度（不受显示约束限制）
 * 用于布局计算，获取节点实际需要的宽度
 *
 * @param value 节点内容
 * @param level 节点层级
 * @returns 原始测量宽度（未应用min/max限制）
 */
// 已移除未使用的 measureNodeRawWidth

/**
 * 计算单个节点的实际宽度
 * 根据节点层级和内容确定节点宽度
 *
 * @param nodeData 节点数据
 * @returns 节点宽度（用于显示，受min/max约束）
 */
// 已移除旧的 calculateNodeWidth（calculateSingleNodeData 兜底估算）

/**
 * 计算单个节点的完整数据（包括尺寸）
 * 注意：先计算宽度，再计算高度，因为高度测量需要知道宽度（特别是多行文本）
 * @param nodeData 原始节点数据
 * @returns 包含计算后尺寸的完整节点数据
 */
export const calculateSingleNodeData = (nodeData: MindNodeData): MindNodeData => {
  // 首选：一次性测量，减少重排与样式切换
  const measured = measureNodeSize(nodeData.value, nodeData.level);
  if (measured) {
    return {
      ...nodeData,
      width: measured.width,
      height: measured.height,
    };
  }

  // 兜底：非浏览器/测量失败时，使用保守估算，保持与历史逻辑一致
  const baseWidth = nodeData.level === 0 ? 100 : nodeData.level === 1 ? 90 : 80;
  const contentLength = nodeData.value.length;
  const estimatedWidth = Math.max(contentLength > 10 ? baseWidth + Math.ceil((contentLength - 10) / 10) * 15 : baseWidth, 60);

  const baseHeights: Record<number, number> = {0: 60, 1: 45, 2: 35};
  const levelKey = nodeData.level >= 2 ? 2 : nodeData.level;
  let estimatedHeight = baseHeights[levelKey] ?? 35;
  const lineCount = nodeData.value.split('\n').length;
  if (lineCount > 1) {
    estimatedHeight += (lineCount - 1) * 20;
  }
  estimatedHeight = Math.max(estimatedHeight, 30);

  return {
    ...nodeData,
    height: estimatedHeight,
    width: estimatedWidth,
  };
};

/**
 * 计算所有节点的totalHeight
 * 从最后一个层级开始，自底向上计算
 * @param mapData 所有节点数据
 * @returns 更新后的节点数据数组
 */
export const calculateTotalHeights = (mapData: MindNodeData[]): MindNodeData[] => {
  // 1. 假定输入已包含尺寸信息（height/width/levelMaxWidth）
  const nodesWithSizes = mapData.map(n => ({...n}));

  // 2. 按层级分组
  const nodesByLevel = new Map<number, MindNodeData[]>();
  nodesWithSizes.forEach(node => {
    if (!nodesByLevel.has(node.level)) {
      nodesByLevel.set(node.level, []);
    }
    nodesByLevel.get(node.level)!.push(node);
  });

  // 3. 获取最大层级
  const maxLevel = Math.max(...Array.from(nodesByLevel.keys()));

  // 4. 从最后一个层级开始，自底向上计算totalHeight
  const updatedNodes = [...nodesWithSizes];

  for (let level = maxLevel; level >= 0; level--) {
    const levelNodes = nodesByLevel.get(level) || [];

    levelNodes.forEach(node => {
      // 查找该节点的所有子节点
      const children = updatedNodes.filter(child => child.parentId === node.id);

      if (children.length === 0) {
        // 叶子节点：totalHeight = height
        node.totalHeight = node.height || 0;
      } else {
        // 父节点：totalHeight = 所有子节点的totalHeight之和
        node.totalHeight = children.reduce((sum, child) => {
          return sum + (child.totalHeight || 0);
        }, 0);
      }

      // 更新节点在数组中的位置
      const nodeIndex = updatedNodes.findIndex(n => n.id === node.id);
      if (nodeIndex !== -1) {
        updatedNodes[nodeIndex] = node;
      }
    });
  }

  return updatedNodes;
};

/**
 * 处理完整的mapData数据
 * 计算所有节点的尺寸和totalHeight
 * @param mapData 原始节点数据数组
 * @returns 处理后的完整节点数据数组
 */
export const processMapData = (mapData: MindNodeData[]): MindNodeData[] => {
  if (!mapData || mapData.length === 0) {
    return [];
  }

  // 步骤1：计算所有节点的真实尺寸（width和height）
  const nodesWithSizes = mapData.map(calculateSingleNodeData);

  // 步骤2：计算每个层级的最大宽度（levelMaxWidth），用于布局计算
  // 方案A：使用“显示宽度”（node.width，经最小/最大宽度裁剪后的宽度）
  // 目的：当父节点文字换行时，只影响Y方向；X方向层级间距保持稳定
  const levelToMaxWidth = new Map<number, number>();

  // 遍历所有节点，找出每层的最大“显示宽度”（用于布局计算）
  nodesWithSizes.forEach(node => {
    const level = node.level;
    const currentMax = levelToMaxWidth.get(level) ?? 0;
    const displayWidth = node.width ?? 120;
    if (displayWidth > currentMax) {
      levelToMaxWidth.set(level, displayWidth);
    }
  });

  // 步骤3：为所有节点设置levelMaxWidth（同一层级所有节点使用相同的最大宽度）
  const nodesWithLevelMaxWidth = nodesWithSizes.map(node => ({
    ...node,
    levelMaxWidth: levelToMaxWidth.get(node.level) ?? node.width ?? 120,
  }));


  // 步骤4：计算totalHeight（自底向上）
  const nodesWithTotalHeights = calculateTotalHeights(nodesWithLevelMaxWidth);

  return nodesWithTotalHeights;
};

/**
 * 根据节点ID查找节点及其所有后代
 * @param nodeId 节点ID
 * @param mapData 所有节点数据
 * @returns 节点及其所有后代的ID数组
 */
export const getNodeAndDescendants = (nodeId: string, mapData: MindNodeData[]): string[] => {
  const getAllDescendants = (parentId: string): string[] => {
    const children = mapData
        .filter(node => node.parentId === parentId)
        .map(node => node.id);

    let descendants = [...children];
    children.forEach(childId => {
      descendants = descendants.concat(getAllDescendants(childId));
    });
    return descendants;
  };

  return [nodeId, ...getAllDescendants(nodeId)];
};

/**
 * 获取指定层级的最大宽度
 * @param level 层级
 * @param mapData 所有节点数据
 * @returns 该层级的最大宽度
 */
export const getLevelMaxWidth = (level: number, mapData: MindNodeData[]): number => {
  const levelNodes = mapData.filter(node => node.level === level);
  if (levelNodes.length === 0) return 80; // 默认宽度

  return Math.max(...levelNodes.map(node => node.width || 80));
};
