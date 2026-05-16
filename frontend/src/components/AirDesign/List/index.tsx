import React, {useEffect, useState} from 'react'
import Icon from '../Icon'
import Help from '../Help'
import MenuButton from '../Button/MenuButton'
import './index.less'

interface ListItemProps {
  id: string
  label: string
  value: string
  icon?: string
  help?: string
  menu?: any
}

interface ListProps {
  title?: string
  buttonPanel?: React.ReactNode
  data?: any[]
  rowSelectable?: boolean
  onRowClick?: (item: any) => void
  selectedRow?: any
  itemIcon?: string
  leftRender?: (item: any) => React.ReactNode
  tagRender?: (item: any) => React.ReactNode
  itemMenu?: (item: any) => any
  width?: number
  height?: number
  labelMaxWidth?: number
}

const List: React.FC<ListProps> = (props) => {
  const {
    data,
    rowSelectable = true,
    onRowClick = () => {
    },
    selectedRow,
    itemIcon = 'item',
    leftRender,
    tagRender,
    itemMenu,
    title = undefined,
    buttonPanel = undefined,
    width = undefined,
    height = undefined,
    labelMaxWidth = undefined,
  } = props

  const hasHeader = title || buttonPanel
  const [currentListItem, setCurrentListItem] = useState<ListItemProps>()

  useEffect(() => {
    setCurrentListItem(selectedRow)
  }, [selectedRow])

  // 当前选中项背景颜色为深蓝，其它项无背景色
  const getRowStyle = (item) => {
    if (currentListItem && item.id === currentListItem.id) {
      return {
        backgroundColor: '#eaf5ff',
      }
    } else {
      return {
        backgroundColor: 'transparent',
      }
    }
  }

  return (
      <div className={'air-list'} style={{width: width, height: height}}>
        {hasHeader ? (
            <div className={'air-list-header'}>
              <span className={'air-list-header-title'}>{title}</span>
              {buttonPanel}
            </div>
        ) : null}
        <div
            className={'air-list-inner'}
            style={{height: hasHeader && height ? height - 50 : height, top: hasHeader ? 50 : 0}}
        >
          {data &&
              data.length > 0 &&
              data.map((item, index) => {
                return (
                    <div
                        className={'air-list-item'}
                        key={index}
                        style={rowSelectable ? {...getRowStyle(item), cursor: 'pointer'} : undefined}
                        onClick={() => {
                          if (rowSelectable) {
                            setCurrentListItem(item)
                            onRowClick(item)
                          }
                        }}
                    >
                      <div className={'air-list-item-left'}>
                        {leftRender ? (
                            leftRender(item)
                        ) : (
                            <div className={'air-list-item-icon'}>
                              <Icon name={item.icon ? item.icon : itemIcon} size={16}/>
                            </div>
                        )}
                        <span className={'air-list-item-text'}>{item.name}</span>
                        <div>{item.description && <Help icon="tags" text={item.description}/>}</div>
                      </div>

                      <div className={'air-list-item-right'}>
                        {tagRender && tagRender(item)}
                        {itemMenu && (
                            <div className={'air-list-item-menu'}>
                              <MenuButton size={22} items={itemMenu(item)}/>
                            </div>
                        )}
                      </div>
                    </div>
                )
              })}
        </div>
      </div>
  )
}

export default List
