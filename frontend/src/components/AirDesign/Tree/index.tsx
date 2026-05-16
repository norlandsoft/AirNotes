import React, {useEffect, useState} from 'react'
import {Typography} from 'antd'
import {Button, Dropdown, Input, Tree} from '@douyinfe/semi-ui'
import Icon from '../Icon'
import './index.less'

interface TreeProps {
  data: any[]
  height?: number
  showFilter?: boolean
  folderIcon?: string
  itemIcon?: string
  groupMenu?: any[]
  itemMenu?: any[]
  rootButtonClick?: () => void
  menuItemClick?: (info: any, data: any) => void
  onSelect?: (info: any) => void
  onChange?: (info: any) => void
  value?: string
  defaultValue?: string | string[]
  defaultExpandedKeys?: string[]
  expandedKeys?: string[]
  onExpand?: (expandedKeys: string[]) => void
  clickToCollapse?: boolean
  draggable?: boolean
  onDrop?: (info: any) => void
  autoExpandParent?: boolean
  stopMenuEventPropagation?: boolean
  checkable?: boolean
}

const AirTree: React.FC<TreeProps> = (props) => {
  const {
    data,
    height = 200,
    showFilter = false,
    folderIcon = 'folder',
    itemIcon = 'document',
    groupMenu,
    itemMenu,
    rootButtonClick,
    menuItemClick,
    onSelect,
    onChange,
    value,
    defaultValue,
    defaultExpandedKeys = [],
    expandedKeys: controlledExpandedKeys,
    onExpand: onExpandCallback,
    clickToCollapse = false,
    draggable = false,
    onDrop,
    autoExpandParent = false,
    stopMenuEventPropagation = true,
    checkable = false,
  } = props

  const [internalKeys, setInternalKeys] = useState(defaultExpandedKeys)
  const keys = controlledExpandedKeys !== undefined ? controlledExpandedKeys : internalKeys
  const setKeys = (newKeys: string[]) => {
    if (controlledExpandedKeys === undefined) {
      setInternalKeys(newKeys)
    }
    onExpandCallback?.(newKeys)
  }

  useEffect(() => {
    // 查找 .semi-tree-search-wrapper 元素
    const searchWrapper = document.querySelector('.semi-tree-search-wrapper')
    if (searchWrapper && searchWrapper instanceof HTMLElement) {
      // 设置 .semi-tree-search-wrapper 的样式
      searchWrapper.style.padding = rootButtonClick ? '0 12px 0 40px' : '0 12px'
    }
  }, [])

  const randomString = (len: number) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let r = ''
    const charactersLength = characters.length
    for (let i = 0; i < len; i++) {
      r += characters.charAt(Math.floor(Math.random() * charactersLength))
    }

    return r
  }

  const handleRootButtonClick = () => {
    if (rootButtonClick) {
      rootButtonClick()
    }
  }

  const handleMenuItemClick = (info, data) => {
    if (menuItemClick) {
      menuItemClick(info, data)
    }
  }

  const renderMenuBar = (data, menu) => {
    return menu ? (
        <Dropdown.Menu>
          {menu.map((item) => {
            return item.type === 'divider' ? (
                <Dropdown.Divider key={randomString(12)}/>
            ) : (
                <Dropdown.Item
                    style={{minWidth: '100px'}}
                    key={item.key}
                    onClick={(e) => handleMenuItemClick(item, data)}
                >
                  {item.label}
                </Dropdown.Item>
            )
          })}
        </Dropdown.Menu>
    ) : null
  }

  const itemSelect = (key, _, node) => {
    !clickToCollapse
        ? (() => {
          const f = keys.find((item) => item === key)
          if (!f && node.children) {
            // 展开
            const newKeys = keys.concat([key])
            setKeys(newKeys)
          }
        })()
        : null

    // 事件响应
    if (onSelect) {
      onSelect(node)
    }
  }

  const itemExpand = (keyArray: string[]) => {
    setKeys(keyArray)
  }

  const renderLabel = (label, data) => {
    // 自定义点击事件
    const handleLabelClick = (e) => {
      e.stopPropagation()
      // 如果是禁用节点，执行自定义逻辑
      if (data.disabled) {
        // 如果为group，则展开
        if (data.type === 'group') {
          setKeys(keys.concat([data.key]))
        } else {
          // 如果为item，则打开菜单
          if (data.menu) {
            setKeys(keys.concat([data.key]))
          }
        }
      }
    }

    const hasMenu =
        (data.type === 'group' && (data.menu || groupMenu)) ||
        (data.type === 'item' && (data.menu || itemMenu)) ||
        (data.type !== 'group' && data.type !== 'item' && itemMenu)

    return (
        <div
            className={'air-tree-label' + (hasMenu ? ' air-tree-label-with-button' : '')}
            onClick={data.disabled ? handleLabelClick : undefined}
        >
          <div className={'air-tree-node-icon'}>
            {data.image ? (
                <Icon name={data.image} size={18}/>
            ) : (
                <Icon name={data.type === 'group' ? folderIcon : itemIcon} size={18}/>
            )}
          </div>
          <Typography.Text ellipsis={{tooltip: data.label}}>{data.label}</Typography.Text>
          {hasMenu ? (
              <Dropdown
                  trigger={'click'}
                  position={'bottomRight'}
                  zIndex={100}
                  render={
                    data.menu
                        ? renderMenuBar(data, data.menu)
                        : data.type === 'group'
                            ? renderMenuBar(data, groupMenu)
                            : renderMenuBar(data, itemMenu)
                  }
                  clickToHide={true}
                  stopPropagation={stopMenuEventPropagation}
              >
                <Button
                    onClick={(e) => {
                      // 阻止事件冒泡
                      if (stopMenuEventPropagation) {
                        e.stopPropagation()
                        e.nativeEvent.stopImmediatePropagation()
                      }
                    }}
                    icon={<Icon name={'more'} size={20}/>}
                    size="small"
                />
              </Dropdown>
          ) : null}
        </div>
    )
  }

  const searchRender = (props) => {
    return <Input {...props} />
  }

  return (
      <div className={'air-tree-wrapper'} style={{height: height}}>
        {showFilter && rootButtonClick ? (
            <Button className={'air-tree-root-button'} onClick={handleRootButtonClick}>
              <Icon name={'add'} size={20} thickness={2}/>
            </Button>
        ) : null}
        <Tree
            {...props}
            treeData={data}
            className={'air-tree'}
            filterTreeNode={showFilter}
            showFilteredOnly={showFilter}
            renderLabel={renderLabel}
            searchRender={searchRender}
            onSelect={itemSelect}
            onChange={onChange}
            onExpand={itemExpand}
            expandedKeys={keys}
            expandAction={clickToCollapse ? 'click' : undefined}
            disableStrictly={true}
            emptyContent={' '}
            draggable={draggable}
            onDrop={onDrop}
            multiple={checkable}
            defaultValue={defaultValue}
            virtualize={{
              height: showFilter ? height - 60 : height,
              itemSize: 36,
            }}
            autoExpandParent={autoExpandParent}
        />
      </div>
  )
}

export default AirTree
