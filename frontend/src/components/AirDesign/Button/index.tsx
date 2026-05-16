/**
 * Button 毛玻璃风格按钮，支持 default/primary/danger/text/link 五种类型
 * icon 支持 string（图标名，用 Icon 渲染）或 ReactNode
 * Created by ChaiMingXu
 */
import React, {FC, MouseEvent, ReactNode} from 'react'
import Icon from '../Icon'
import './index.less'

interface ButtonProps {
  type?: string
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void
  style?: React.CSSProperties
  disabled?: boolean
  icon?: ReactNode | string
  loading?: boolean
  children?: ReactNode

  [key: string]: unknown
}

const Button: FC<ButtonProps> = (props) => {
  const {
    children,
    onClick,
    type = 'default',
    style = {},
    disabled = false,
    icon = null,
    loading = false,
    ...restProps
  } = props

  const isDisabled = disabled || loading
  // primary 和 danger 类型使用白色图标
  const iconColor = type === 'primary' || type === 'danger' ? '#fff' : '#123F68'
  const iconNode =
      icon == null ? null : typeof icon === 'string' ? <Icon name={icon} size={16} color={iconColor}/> : icon

  return (
      <button
          tabIndex={-1}
          className={isDisabled ? 'air-button' : `air-button air-button-${type}`}
          onClick={onClick}
          style={style}
          disabled={isDisabled}
          {...restProps}
      >
      <span>
        {iconNode}
        {children}
      </span>
      </button>
  )
}

export default Button
