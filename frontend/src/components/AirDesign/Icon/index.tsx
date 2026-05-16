/**
 * Icon 组件：按 name 渲染 SVG 图标，使用构建时生成的 icons-data
 * 优化：使用 useMemo 避免不必要的重复解析
 * Created by ChaiMingXu
 */
import React, {useMemo} from 'react'
import {iconData} from './icons-data'

interface IconsProps {
  name: string
  size?: number
  color?: string
  thickness?: number
  className?: string
}

/**
 * 判断 fill 值是否为固定色值（不应被 color prop 覆盖）
 * 约定：白色系色值作为固定色，用于多色图标中需要保留的填充区域
 */
function isFixedFill(fill: string): boolean {
  const normalized = fill.toLowerCase().trim()
  return normalized === '#fff' || normalized === '#ffffff' || normalized === 'white'
}

/**
 * 纯函数：解析 SVG 字符串，设置尺寸、颜色和描边粗细
 */
function parseSvg(name: string, size: number, color: string, thickness: number): string | null {
  let raw = iconData[name]
  if (!raw) {
    raw =
        iconData[name.toLowerCase()] ??
        iconData[name.toUpperCase()] ??
        iconData[name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()]
  }
  if (!raw) {
    return null
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(raw, 'image/svg+xml')
  const svgElement = doc.querySelector('svg')
  if (!svgElement) {
    return null
  }

  svgElement.setAttribute('height', size.toString())
  svgElement.setAttribute('width', size.toString())

  // 处理所有图形元素，设置颜色和描边粗细
  const allElements = svgElement.querySelectorAll(
      'g, path, circle, rect, line, polyline, polygon, ellipse'
  )
  allElements.forEach((element) => {
    // 设置描边粗细
    if (element.hasAttribute('stroke-width')) {
      element.setAttribute('stroke-width', thickness.toString())
    }
    // 替换 stroke 颜色
    if (element.hasAttribute('stroke')) {
      element.setAttribute('stroke', color)
    }
    // 替换 fill 颜色（如果 fill 不是 none 或固定色值）
    const fill = element.getAttribute('fill')
    if (fill && fill !== 'none' && fill !== 'transparent' && !isFixedFill(fill)) {
      element.setAttribute('fill', color)
    }
  })

  // 处理 svg 根元素上的 fill 和 stroke
  if (svgElement.hasAttribute('stroke')) {
    svgElement.setAttribute('stroke', color)
  }
  const svgFill = svgElement.getAttribute('fill')
  if (svgFill && svgFill !== 'none' && svgFill !== 'transparent' && !isFixedFill(svgFill)) {
    svgElement.setAttribute('fill', color)
  }

  return svgElement.outerHTML
}

const Icon: React.FC<IconsProps> = (props) => {
  const {name, size = 24, color = '#123F68', thickness = 1.5, className} = props

  const svgContent = useMemo(() => {
    if (!name) return null
    return parseSvg(name, size, color, thickness)
  }, [name, size, color, thickness])

  if (!name) {
    return <div className={className} style={{width: size, height: size}}/>
  }

  if (svgContent === null) {
    return (
        <div className={className} style={{width: size, height: size, color: 'red'}}>
          {name}
        </div>
    )
  }

  return (
      <div
          className={className}
          style={{
            width: size,
            height: size,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          dangerouslySetInnerHTML={{__html: svgContent}}
      />
  )
}

export default Icon
