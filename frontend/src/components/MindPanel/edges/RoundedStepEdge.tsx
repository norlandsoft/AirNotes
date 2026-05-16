import React from 'react';
import {BaseEdge, EdgeProps} from '@xyflow/react';

/**
 * 自定义圆角正交折线 Edge
 * 功能说明：
 * - 按 Step（水平-垂直-水平）的正交路径连接 source 到 target
 * - 在两个拐角处加入固定半径的圆角（使用 SVG 弧 A 指令）
 * - 支持通过 edge.data.radius 自定义圆角半径（默认 10）
 * - 仅渲染路径，不渲染标签；如需标签可使用 EdgeLabelRenderer 扩展
 */
const RoundedStepEdge: React.FC<EdgeProps> = (props) => {
  const {id, sourceX, sourceY, targetX, targetY, style} = props;

  const stroke = (style as any)?.stroke || '#1890ff';
  const strokeWidth = (style as any)?.strokeWidth || 1.5;
  const radiusRaw = (props.data as any)?.radius ?? 10;
  const r = Math.max(0, Number(radiusRaw) || 0);

  // 采用中点 X 作为转折列，形成水平->垂直->水平的三段式折线路径
  const mx = (sourceX + targetX) / 2;

  // 水平与垂直方向的符号（用于决定圆角方向）
  const vSign = sourceY <= targetY ? 1 : -1; // 垂直方向
  const hSign2 = mx <= targetX ? 1 : -1; // 第三段水平方向

  // 计算每一段可用长度，避免 r 过大导致交叠
  const vLen = Math.abs(targetY - sourceY);
  const hLen2 = Math.abs(targetX - mx);

  const cornerR2 = Math.min(r, hLen2, Math.max(0, vLen));

  // 垂直段末端：从 (mx, sy) 到 (mx, ty - vSign*cornerR2)
  const p2x = mx;
  const p2y = targetY - vSign * cornerR2;

  // 仅在 target 端使用圆角
  const c2x = mx + hSign2 * cornerR2;
  const c2y = targetY;
  const sweep2 = (vSign === 1 && hSign2 === -1) || (vSign === -1 && hSign2 === 1) ? 1 : 0;

  // 第三段水平：到 (tx, ty)
  const path = [
    `M ${sourceX} ${sourceY}`,
    // 源端保持直角：水平到中线，再垂直到目标附近
    `L ${mx} ${sourceY}`,
    `L ${p2x} ${p2y}`,
    // 目标端圆角
    `A ${cornerR2} ${cornerR2} 0 0 ${sweep2} ${c2x} ${c2y}`,
    `L ${targetX} ${targetY}`
  ].join(' ');

  return (
      <>
        <BaseEdge id={id} path={path} style={{stroke, strokeWidth, fill: 'none'}}/>
      </>
  );
};

export default RoundedStepEdge;


