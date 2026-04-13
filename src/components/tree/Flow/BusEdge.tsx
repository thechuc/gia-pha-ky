import React, { memo } from "react";
import type { EdgeProps } from "@xyflow/react";

/**
 * BusEdge — Custom edge kiểu "bus bar" cho cây gia phả.
 *
 * Thay vì mỗi edge tự vẽ đường zigzag riêng, toàn bộ nhóm anh em cùng cha
 * chia sẻ một thanh ngang (bus). Cơ chế:
 *  - Edge đầu tiên (isFirstChild) vẽ: thân đứng từ cha → bus + thanh ngang bus
 *  - Mọi edge (kể cả đầu tiên) vẽ: thân đứng từ bus → đỉnh node con
 *
 * Kết quả: đường nối gọn, thẳng góc vuông, đúng kiểu gia phả truyền thống.
 */
export interface BusEdgeData {
  isHighlighted?: boolean;
  direction?: "TB" | "LR";
}

const BusEdgeComponent = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
}: EdgeProps) => {
  const edgeData = data as unknown as BusEdgeData;

  if (!edgeData) {
    return null;
  }

  const { isHighlighted, direction } = edgeData;
  const isLR = direction === "LR";
  const strokeColor = isHighlighted ? "#EAB308" : "#64748B";
  const strokeWidth = isHighlighted ? 3.5 : 2;

  // Round coordinates to avoid sub-pixel artifacts
  const startX = Math.round(sourceX);
  const startY = Math.round(sourceY);
  const endX = Math.round(targetX);
  const endY = Math.round(targetY);

  if (isLR) {
    // Horizontal Layout (Left to Right)
    // Bus bar is vertical, main trunk is horizontal
    // We want the bus bar to be in the middle of the gap
    const gap = endX - startX;
    const busOffset = gap / 2;
    const calculatedBusX = Math.round(startX + busOffset);

    return (
      <g>
        {/* 1. Main trunk from father to bus (Horizontal) */}
        <path
          d={`M ${startX},${startY} L ${calculatedBusX},${startY}`}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="square"
        />
        
        {/* 2. Vertical bus connecting siblings */}
        {Math.abs(startY - endY) > 1 && (
          <path
            d={`M ${calculatedBusX},${startY} L ${calculatedBusX},${endY}`}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="square"
          />
        )}
        
        {/* 3. Horizontal branch to child */}
        <path
          d={`M ${calculatedBusX},${endY} L ${endX},${endY}`}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="square"
        />
      </g>
    );
  }

  // Vertical Layout (Top to Bottom) - Default
  const calculatedBusY = Math.round(startY + (endY - startY) / 2);

  return (
    <g>
      {/* 1. Main trunk from father to bus (Vertical) */}
      <path
        d={`M ${startX},${startY} L ${startX},${calculatedBusY}`}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="square"
      />
      
      {/* 2. Horizontal bus connecting siblings */}
      {startX !== endX && (
        <path
          d={`M ${startX},${calculatedBusY} L ${endX},${calculatedBusY}`}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="square"
        />
      )}
      
      {/* 3. Vertical branch to child */}
      <path
        d={`M ${endX},${calculatedBusY} L ${endX},${endY}`}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="square"
      />
    </g>
  );
};

export const BusEdge = memo(BusEdgeComponent);
