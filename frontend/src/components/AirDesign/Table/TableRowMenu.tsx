import React, {useState} from 'react'
import Icon from '../Icon'
import {Button, Dropdown} from '@douyinfe/semi-ui'

const TableRowMenu: React.FC<any> = (props) => {
  const {items, data = undefined} = props
  const [visible, setVisible] = useState(false)
  const [hovered, setHovered] = useState(false) // 添加悬停状态

  // 下拉菜单展开/收起事件处理
  const handleVisibleChange = (visible: boolean) => {
    setVisible(visible)
  }

  // 鼠标悬停事件处理
  const handleMouseEnter = () => {
    setHovered(true)
  }

  const handleMouseLeave = () => {
    setHovered(false)
  }

  return (
      <Dropdown
          trigger={'click'}
          position={'bottomRight'}
          clickToHide={true}
          stopPropagation={true}
          onVisibleChange={handleVisibleChange} // 监听展开/收起事件
          render={
            <Dropdown.Menu>
              {items.map((item: any, index: number) => {
                // 如果 item 类型为 split，显示分隔符
                if (item.type === 'split') {
                  return (
                      <Dropdown.Item
                          key={item.key || `split-${index}`}
                          disabled={true}
                          style={{
                            height: '1px',
                            background: '#f1f2f3',
                            padding: 0,
                            margin: 0,
                            cursor: 'default',
                            pointerEvents: 'none',
                          }}
                      />
                  )
                }
                // 普通菜单项
                return (
                    <Dropdown.Item
                        key={item.key || index}
                        disabled={item.disabled}
                        onClick={() => {
                          if (!item.disabled && item.onClick) item.onClick(item, data)
                        }}
                    >
                      {item.label}
                    </Dropdown.Item>
                )
              })}
            </Dropdown.Menu>
          }
      >
        <Button
            onClick={(e) => {
              // 阻止事件冒泡
              e.stopPropagation()
              e.nativeEvent.stopImmediatePropagation()
            }}
            onMouseEnter={handleMouseEnter} // 鼠标进入事件
            onMouseLeave={handleMouseLeave} // 鼠标离开事件
            icon={<Icon name={'more'} size={22}/>}
            size="small"
            style={{
              background: visible || hovered ? '#eee' : 'transparent',
              border: visible || hovered ? '1px solid #e0e0e0' : 'none', // 悬停时也显示边框
              padding: 0,
            }}
        />
      </Dropdown>
  )
}

export default TableRowMenu
