import React from 'react';
import {BaseEdge, EdgeProps} from '@xyflow/react';

/**
 * 根节点 -> 第一级节点 专用连线
 * 样式：
 * 1) 从根节点起点先水平向右 offsetStart 像素；
 * 2) 然后以直线（无贝塞尔）折向目标，在目标左侧 bendOffsetEnd 位置与目标同一水平；
 * 3) 最后一段水平直线连接至目标控制点。
 * 可通过 edge.data 控制：
 *  - color: 线颜色（默认 #1890ff）
 *  - width: 线宽（默认 2）
 *  - offsetStart: 源端水平偏移（默认 50）
 *  - bendOffsetEnd: 目标端左侧开始水平的距离（默认 30）
 */
const FirstStepEdge: React.FC<EdgeProps> = (props) => {
  const {id, sourceX, sourceY, targetX, targetY, style, data} = props;

  const color = (data && (data as any).color) || (style as any)?.stroke || '#1890ff';
  const width = (data && Number((data as any).width)) || (style as any)?.strokeWidth || 2;
  const offsetStart = (data && Number((data as any).offsetStart)) || 50;
  const bendOffsetEnd = (data && Number((data as any).bendOffsetEnd)) || 30;

  // 关键点：
  const p1x = sourceX + Math.max(0, offsetStart); // 水平推进后的转折点
  const p1y = sourceY;
  const p2x = targetX - Math.max(0, bendOffsetEnd); // 目标左侧固定距离处，Y 与目标一致
  const p2y = targetY;

  // 路径：水平 → 斜线 → 水平（不使用贝塞尔）
  const path = [
    `M ${sourceX} ${sourceY}`,
    `L ${p1x} ${p1y}`,
    `L ${p2x} ${p2y}`,
    `L ${targetX} ${targetY}`
  ].join(' ');

  return (
      <BaseEdge id={id} path={path} style={{stroke: color, strokeWidth: width, fill: 'none'}}/>
  );
};

export default FirstStepEdge;
