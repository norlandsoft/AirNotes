import React, {ReactNode} from 'react'
import {ConfigProvider, Dropdown, Tooltip} from 'antd'
import Icon from '../Icon'
import './IconButton.less'

type DropdownPlacement =
    | 'top'
    | 'topLeft'
    | 'topRight'
    | 'bottom'
    | 'bottomLeft'
    | 'bottomRight'
    | 'left'
    | 'leftTop'
    | 'leftBottom'
    | 'right'
    | 'rightTop'
    | 'rightBottom'

/** Ant Design Dropdown 仅声明了部分 placement，实际 rc-trigger 支持 left/right 等 */
type AntdDropdownPlacement =
    | 'top'
    | 'topLeft'
    | 'topRight'
    | 'bottom'
    | 'bottomLeft'
    | 'bottomRight'
    | 'topCenter'
    | 'bottomCenter'

interface IconButtonProps {
  icon?: string
  customIcon?: ReactNode // 自定义图标组件
  size?: number
  items?: any[]
  onClick?: () => void
  tooltip?: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
  /** 有 items 时下拉菜单展开方向，默认 bottomLeft */
  dropdownPlacement?: DropdownPlacement
  disabled?: boolean
  bordered?: boolean
  shape?: 'circle' | 'square' | 'default'
  style?: any
}

const IconButton: React.FC<IconButtonProps> = (props) => {
  const {
    icon,
    customIcon,
    size,
    items,
    onClick,
    tooltip,
    placement = 'top',
    dropdownPlacement = 'bottomLeft',
    disabled = false,
    bordered = false,
    shape = 'default',
    style,
  } = props

  const iconSize = size ? size - 12 : 22
  // 随机ID
  const randomId = Math.random().toString(36).substring(2, 15)
  const buttonId = `air-icon-button-${randomId}`

  const borderRadius = shape === 'circle' ? '50%' : '3px'

  // 如果提供了自定义图标，使用自定义图标；否则使用 Icon 组件
  const iconElement = customIcon ? (
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        {customIcon}
      </div>
  ) : icon ? (
      <Icon name={icon} size={iconSize}/>
  ) : null

  const buttonContent = (
      <div
          className={`air-icon-button ${disabled ? 'disabled' : ''}`}
          style={{
            height: size,
            lineHeight: `${size}px`,
            width: size,
            border: bordered ? '1px solid #ddd' : 'none',
            borderRadius: borderRadius,
            ...style,
          }}
          onClick={disabled ? undefined : onClick}
          id={buttonId}
      >
        {iconElement}
      </div>
  )

  const wrappedButton = items ? (
      <Dropdown
          menu={{items}}
          trigger={['click']}
          destroyOnHidden={true}
          placement={dropdownPlacement as AntdDropdownPlacement}
          getPopupContainer={() => document.body}
          overlayClassName="air-icon-button-dropdown"
      >
        {buttonContent}
      </Dropdown>
  ) : (
      buttonContent
  )

  return tooltip ? (
      <ConfigProvider
          theme={{
            token: {
              borderRadius: 0,
            },
          }}
      >
        <Tooltip title={tooltip} placement={placement} destroyOnHidden={true} mouseEnterDelay={0.8}>
          {wrappedButton}
        </Tooltip>
      </ConfigProvider>
  ) : (
      <>{wrappedButton}</>
  )
}

export default IconButton
