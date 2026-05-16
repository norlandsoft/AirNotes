export interface MindNodeData {
  // 基本属性
  id: string;                    // 节点ID
  level: number;                 // 节点层级（0为根节点）
  parentId?: string | null;      // 父节点ID，根节点为null
  documentId?: string;           // 所属文档ID，用于标识该节点属于哪个思维导图文档

  // 内容属性
  value: string;              // 节点内容
  color?: string;               // 节点颜色
  collapsed?: boolean;          // 是否折叠（为true时，隐藏所有子节点及其后续节点）

  // 尺寸属性
  height?: number;              // 节点高度
  width?: number;               // 节点宽度
  totalHeight?: number;         // 所有后代的总高度
  levelMaxWidth?: number;       // 本层级的最大宽度（用于层级对齐与水平布局）

  // 位置属性
  x: number;                    // 横轴坐标
  y: number;                    // 纵轴坐标（左上角）
  ym: number;                   // 纵轴坐标（左中）
}

export interface MindData {
  layout: {
    x: number,
    y: number,
    zoom: number
  } | null,
  data: MindNodeData[] | null
}