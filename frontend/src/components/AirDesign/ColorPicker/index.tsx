import React from 'react'
import type {ColorPickerProps} from 'antd'
import {Col, ColorPicker, Divider, Row} from 'antd'
import {blue, green, presetPalettes, red, yellow} from '@ant-design/colors'

import './index.less'

/**
 * 预设颜色类型
 */
type Presets = Required<ColorPickerProps>['presets'][number]

/**
 * 预设颜色配置接口
 */
export interface PresetColorConfig {
  red?: string[]
  blue?: string[]
  green?: string[]
  primary?: string[]
  yellow?: string[]

  [key: string]: string[] | undefined
}

/**
 * 生成预设颜色
 * @param presets 预设调色板配置，默认为 Ant Design 的预设调色板
 * @param maxColors 每组颜色的最大数量，默认为 8
 * @returns 预设颜色数组
 */
function genPresets(
    presets: Record<string, string[]> = presetPalettes,
    maxColors: number = 8
): Presets[] {
  return Object.entries(presets).map<Presets>(([label, colors]) => ({
    label,
    // 只取前 maxColors 个颜色
    colors: colors.slice(0, maxColors),
    key: label,
  }))
}

/**
 * 自定义颜色选择器组件属性
 */
export interface CustomColorPickerProps {
  /** 当前颜色值 */
  value?: string | null
  /** 颜色变化完成时的回调函数 */
  onChangeComplete?: (color: any) => void
  /** 触发方式，默认为 'click' */
  trigger?: 'click' | 'hover'
  /** 自定义预设颜色配置 */
  presetColors?: PresetColorConfig
  /** 弹窗宽度，默认 480px */
  popupWidth?: number
  /** 触发元素 */
  children: React.ReactNode

  /** 其他 ColorPicker 属性 */
  [key: string]: any
}

/**
 * 自定义颜色选择器组件
 *
 * 功能特点：
 * - 支持预设颜色配置
 * - 水平布局：左侧显示预设颜色，右侧显示颜色选择器
 * - 可自定义弹窗宽度
 * - 可自定义触发方式和回调函数
 *
 * @example
 * ```tsx
 * <CustomColorPicker
 *   value={color}
 *   onChangeComplete={(color) => {
 *     console.log(color.toHexString());
 *   }}
 * >
 *   <button>选择颜色</button>
 * </CustomColorPicker>
 * ```
 */
const AirColorPicker: React.FC<CustomColorPickerProps> = ({
                                                            value,
                                                            onChangeComplete,
                                                            trigger = 'click',
                                                            presetColors,
                                                            popupWidth = 375,
                                                            children,
                                                            ...otherProps
                                                          }) => {
  // 默认预设颜色：红色、蓝色、绿色、青色
  const defaultPresetColors: PresetColorConfig = {
    red,
    blue,
    green,
    yellow,
  }

  // 合并用户自定义的预设颜色和默认预设颜色
  const finalPresetColors = presetColors || defaultPresetColors

  // 过滤掉 undefined 值，确保类型匹配
  const validPresetColors: Record<string, string[]> = Object.entries(finalPresetColors).reduce(
      (acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value
        }
        return acc
      },
      {} as Record<string, string[]>
  )

  // 生成预设颜色数组
  const presets = genPresets(validPresetColors)

  /**
   * 自定义颜色选择器面板布局
   * 使用水平布局：左侧显示预设颜色，右侧显示颜色选择器，中间用分隔线分隔
   */
  const customPanelRender: ColorPickerProps['panelRender'] = (
      _,
      {components: {Picker, Presets}}
  ) => (
      <Row justify="space-between" wrap={false}>
        <Col flex="auto">
          <Picker/>
        </Col>
        <Divider type="vertical" style={{height: 'auto'}}/>
        <Col span={12}>
          <Presets/>
          <div
              className="air-color-picker-no-colors"
              onClick={() => {
                onChangeComplete?.({toHexString: () => '#ffffff'})
              }}
          >
            无背景色
          </div>
        </Col>
      </Row>
  )

  return (
      <ColorPicker
          trigger={trigger}
          value={value || undefined}
          presets={presets}
          panelRender={customPanelRender}
          styles={{popupOverlayInner: {width: popupWidth}}}
          onChangeComplete={onChangeComplete}
          {...otherProps}
      >
        {children}
      </ColorPicker>
  )
}

export default AirColorPicker
