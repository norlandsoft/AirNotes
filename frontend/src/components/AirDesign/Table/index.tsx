import React, {useEffect, useRef} from 'react'
import {Pagination, Table} from '@douyinfe/semi-ui'
import './index.less'

const Grid: React.FC<any> = (props) => {
  const {
    data,
    columns,
    height,
    padding = 4,
    bordered = false,
    headerHeight = 40,
    rowHeight = 40,
    onItemClick,
    showHeader = true,
    headerPanel,
    customStyles = {},
    pagination = false,
    showEmpty = false,
    emptyText = '暂无数据',
  } = props

  const [innerWidth, setInnerWidth] = React.useState(200)
  const innerHeight = height - padding * 2 + 'px'

  const scrollY =
      height -
      (showHeader ? headerHeight : 0) -
      padding * 2 -
      (pagination ? 40 : 0) -
      (headerPanel ? 50 : 0) -
      (bordered ? 2 : 0)

  const tableRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!tableRef.current) return
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const containerWidth = entry.contentRect.width
        setInnerWidth(containerWidth)
      }
    })

    const tableContainer = tableRef.current.querySelector('.semi-table-container')
    if (tableContainer) {
      resizeObserver.observe(tableContainer)
    }

    // 设置滚动条样式，只在有滚动内容时显示
    const setupScrollbarStyle = () => {
      const tableBody = tableRef.current?.querySelector('.semi-table-body')
      if (tableBody) {
        // 设置overflow-y为auto，只在需要时显示滚动条
        ;(tableBody as HTMLElement).style.overflowY = 'auto'
        ;(tableBody as HTMLElement).style.overflowX = 'auto'
      }
    }

    // 立即执行一次
    setupScrollbarStyle()

    // 使用MutationObserver监听DOM变化，确保滚动条设置持续生效
    const observer = new MutationObserver(() => {
      setupScrollbarStyle()
    })

    if (tableRef.current) {
      observer.observe(tableRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class'],
      })
    }

    return () => {
      resizeObserver.disconnect()
      observer.disconnect()
    }
  }, [])

  const renderPagination = (paginationProps: any) => {
    const {total, pageSize, currentPage, onChange} = paginationProps
    return (
        <div
            className="air-table-pagination"
            style={{
              width: innerWidth,
              backgroundColor: '#f5f5f5',
              borderTop: '1px solid #ddd',
              display: 'flex',
              justifyContent: 'end',
              alignItems: 'center',
            }}
        >
          <Pagination total={total} pageSize={pageSize} showTotal onChange={onChange}></Pagination>
        </div>
    )
  }

  const renderEmpty = () => {
    return showEmpty ? (
        <div className="air-table-empty">
          <div>
            <span>{emptyText}</span>
          </div>
        </div>
    ) : (
        <div></div>
    )
  }

  return (
      <div
          ref={tableRef}
          className="air-table-container"
          style={{padding: padding, ...customStyles}}
      >
        <div
            style={{
              height: innerHeight,
              border: bordered ? '1px solid #ddd' : 'none',
              boxSizing: 'border-box',
              borderRadius: '2px',
            }}
        >
          <Table
              dataSource={data}
              columns={columns}
              scroll={{y: scrollY}}
              {...props}
              pagination={pagination}
              title={headerPanel}
              bordered={false} // 去掉表格自身边框
              empty={renderEmpty()}
              showHeader={showHeader}
              onHeaderRow={() => {
                return {
                  height: headerHeight + 'px',
                }
              }}
              style={{
                // 如果无border但显示header，则只设置上边框；否则无边框
                borderTop: !bordered && showHeader ? '1px solid #ddd' : undefined,
                boxSizing: 'border-box',
              }}
              onRow={(record, _) => {
                return {
                  onClick: (event) => {
                    onItemClick && onItemClick(record, event)
                  },
                  onMouseEnter: (event) => {
                  },
                  onMouseLeave: (event) => {
                  },
                  className: '',
                  style: {
                    cursor: onItemClick ? 'pointer' : 'default',
                    height: rowHeight + 'px',
                  },
                }
              }}
              renderPagination={pagination ? (paginationProps) => renderPagination(paginationProps) : undefined}
          />
        </div>
      </div>
  )
}

export default Grid
