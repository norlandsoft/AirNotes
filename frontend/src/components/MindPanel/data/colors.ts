/**
 * 思维导图节点颜色配置
 * 用于为不同类型的节点提供颜色选择
 */
export const MIND_NODE_COLORS = [
  '#ff6b6b', // 红色 - 重要主题
  '#ffa069', // 橙色 - 次要主题  
  '#97d4b6', // 绿色 - 支持主题
  '#88e2d7', // 青色 - 补充主题
  '#6fd0f9', // 蓝色 - 扩展主题
  '#e18bef', // 紫色 - 特殊主题
] as const;

/**
 * 根据层级获取对应的颜色
 * @param level 节点层级
 * @returns 对应的颜色值
 */
export const getColorByLevel = (level: number): string => {
  return MIND_NODE_COLORS[level % MIND_NODE_COLORS.length];
};

/**
 * 根据索引获取颜色
 * @param index 颜色索引
 * @returns 对应的颜色值
 */
export const getColorByIndex = (index: number): string => {
  return MIND_NODE_COLORS[index % MIND_NODE_COLORS.length];
};
