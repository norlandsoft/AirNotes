import React, {useState} from 'react'
import {Dropdown} from '@douyinfe/semi-ui'
import Icon from '../Icon'
import './MenuButton.less'

interface MenuButtonProps {
  size?: number
  items: any
  type?: 'horizontal' | 'vertical'
  transClickEvent?: boolean
  innerMargin?: number
  style?: any
}

const MenuButton: React.FC<MenuButtonProps> = (props) => {
  const {
    size = 24,
    items,
    type = 'horizontal',
    transClickEvent = false,
    innerMargin = 4,
    style,
  } = props

  const [visible, setVisible] = useState(false)

  const handleVisibleChange = (visible: boolean) => {
    setVisible(visible)
  }

  return (
      <Dropdown
          trigger={'click'}
          visible={visible}
          onVisibleChange={handleVisibleChange}
          render={
            <Dropdown.Menu>
              {items.map((item: any, index: number) => {
                if (item.type === 'split') {
                  return (
                      <Dropdown.Item
                          key={index}
                          style={{height: '1px', background: '#f1f2f3', padding: '0 3px'}}
                      />
                  )
                } else {
                  return (
                      !item.disabled && (
                          <Dropdown.Item
                              key={index}
                              onClick={(e) => {
                                // 阻止事件冒泡
                                e.stopPropagation()
                                e.nativeEvent.stopImmediatePropagation()
                                if (item.onClick) {
                                  item.onClick(e)
                                }
                                // 关闭下拉菜单
                                setVisible(false)
                              }}
                          >
                            {item.label}
                          </Dropdown.Item>
                      )
                  )
                }
              })}
            </Dropdown.Menu>
          }
      >
        <div
            className={'air-menu-button'}
            style={{width: size, height: size, lineHeight: size, margin: innerMargin, ...style}}
            onClick={(e) => {
              // 阻止事件冒泡
              if (!transClickEvent) {
                e.stopPropagation()
                e.nativeEvent.stopImmediatePropagation()
              }
            }}
        >
          <Icon name={type === 'horizontal' ? 'more' : 'menu'} size={size - 8}/>
        </div>
      </Dropdown>
  )
}

export default MenuButton
