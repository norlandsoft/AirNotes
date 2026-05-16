import React from 'react'
import {ConfigProvider, Tabs, Tooltip} from 'antd'
import Icon from '../Icon'
import './index.less'

interface TabItemProps {
  key: string
  label: string
  icon?: any
  closable: boolean
  children: React.ReactNode
}

interface TabPanelProps {
  height: number
  width: number
  items: TabItemProps[]
  currentTab: TabItemProps
  // onChangeTab方法
  onChangeTab?: (tab: any) => void
  onRemoveTab?: (tab: any) => void
  tabHeight?: number
}

const TabPanel: React.FC<TabPanelProps> = (props) => {
  const MAX_TAB_LENGTH = 16

  const {
    height,
    width,
    items = [],
    currentTab,
    onChangeTab,
    onRemoveTab,
    tabHeight = 40, // 默认值
  } = props

  const [currentKey, setCurrentKey] = React.useState<string | undefined>(undefined)

  React.useEffect(() => {
    if (currentTab?.key) {
      setCurrentKey(currentTab?.key)
    } else {
      setCurrentKey(items[0]?.key)
    }
  }, [currentTab])

  // 设置 tab-height
  React.useEffect(() => {
    document.documentElement.style.setProperty('--air-tab-panel-height', `${tabHeight}px`)
  }, [tabHeight])

  const tabItems: any[] = []
  items.map((tab) => {
    const title = (
        <Tooltip
            placement="top"
            title={tab.label.length > MAX_TAB_LENGTH ? tab.label : null}
            arrow={false}
            autoAdjustOverflow={false}
            styles={{
              root: {maxWidth: 'unset'},
              body: {whiteSpace: 'nowrap', borderRadius: '2px'},
            }}
        >
          <div className={'air-tabs-button'}>
            {/*<div className={'air-tabs-button-split'}></div>*/}
            {tab.icon ? <Icon name={tab.icon} size={18}/> : null}
            {tab.label.length > MAX_TAB_LENGTH
                ? `${tab.label.substring(0, MAX_TAB_LENGTH)}...`
                : tab.label}
          </div>
        </Tooltip>
    )

    tabItems.push({label: title, key: tab.key, closable: tab.closable, icon: undefined})
  })

  const handleChangeTab = (key) => {
    const tab = items.find((tab) => tab.key === key)
    setCurrentKey(tab?.key)
    if (onChangeTab) {
      onChangeTab(tab)
    }
  }

  return (
      <ConfigProvider prefixCls="air">
        <div className={'air-tab-panel'} style={{height, width}}>
          <div style={{height: tabHeight, boxSizing: 'border-box'}}>
            {items.length > 0 && (
                <Tabs
                    hideAdd
                    type="editable-card"
                    items={tabItems}
                    activeKey={currentKey}
                    onChange={handleChangeTab}
                    onEdit={(key, action) => {
                      if (action === 'remove') {
                        const tab = items.find((tab) => tab.key === key)
                        if (onRemoveTab) {
                          onRemoveTab(tab)
                        }
                      }
                    }}
                />
            )}
          </div>
          <div style={{height: height - tabHeight, boxSizing: 'border-box'}}>
            {items.find((item) => item.key === currentKey)?.children}
          </div>
        </div>
      </ConfigProvider>
  )
}

export default TabPanel
