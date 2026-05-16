import React from 'react'
import {Drawer} from 'antd'
import Button from '../Button'
import Icon from '../Icon'
import './index.less'

const SlidePanel = (props) => {
  const {
    children,
    maskClosable = false,
    buttonStyles,
    hasCloseButton = false,
    hasButtonBar = true,
    onConfirm,
    onClose,
    confirmButtonText = '确定',
    closeButtonText = '取消',
    open,
    placement = 'right',
    title,
    bodyPadding = '24',
    bodyBackgroundColor = '#fff',
    type = 'default' /* small, default, large, huge, custom */,
    width = 378,
    onOpenChange = (opened: boolean) => {
    },
    /* custom footer components */
    footerExtra,
    /* inner drawer */
    innerDrawer = undefined, // 内嵌抽屉的内容
    innerDrawerWidth = 600, // 内嵌抽屉宽度
    showInnerDrawer = false, // 内嵌抽屉是否打开
    onInnerClose = () => {
    }, // 内嵌抽屉关闭回调
  } = props

  const footerContent = (
      <div className={'air-slide-footer'}>
      <span>
        {onConfirm ? (
            <Button
                type={'primary'}
                onClick={onConfirm}
                style={{marginRight: '12px', ...buttonStyles}}
            >
              {confirmButtonText}
            </Button>
        ) : null}
        {onClose ? (
            <Button type={'default'} onClick={onClose}>
              {closeButtonText}
            </Button>
        ) : null}
      </span>
        <span>{footerExtra && <div>{footerExtra}</div>}</span>
      </div>
  )

  const getPanelWidth = () => {
    switch (type) {
      case 'small':
        return 290
      case 'medium':
        return 520
      case 'large':
        return 850
      case 'huge':
        return 1280
      case 'full':
        return '100%'
      case 'custom':
        return width
      case 'default':
      default:
        return 378
    }
  }

  const getPanelHeight = () => {
    return 255
  }

  return (
      <Drawer
          extra={<div>&nbsp;</div>}
          closable={false}
          maskClosable={maskClosable}
          onClose={onClose}
          open={open}
          afterOpenChange={onOpenChange}
          height={type === 'full' ? '100%' : getPanelHeight()}
          placement={type === 'full' ? 'top' : placement}
          footer={hasButtonBar ? footerContent : null}
          title={hasCloseButton || title ? ' ' : null}
          style={{overflow: 'hidden'}}
          styles={{
            header: {
              height: '40px',
              lineHeight: '40px',
              margin: 0,
              padding: 0,
            },
            body: {
              paddingTop: 0,
              paddingBottom: 0,
              paddingLeft: bodyPadding,
              paddingRight: bodyPadding,
              background: bodyBackgroundColor,
            },
            footer: {
              height: '50px',
              lineHeight: '50px',
              borderTop: 'var(--panel-border)',
              background: '#fafafa',
              textAlign: type === 'full' ? 'right' : 'left',
              padding: '0 24px',
              margin: 0,
              boxSizing: 'border-box',
            },
          }}
          width={getPanelWidth()}
          push={{distance: innerDrawerWidth - 32}}
          destroyOnHidden={true}
      >
        {hasCloseButton || title ? (
            <div className={'air-slide-header'}>
              {title ? <div className={'air-slide-header-title'}>{title}</div> : null}
              {hasCloseButton ? (
                  <div className={'air-slide-header-close'} onClick={onClose}>
                    <Icon name={'close'} size={16}/>
                  </div>
              ) : null}
            </div>
        ) : null}
        <div className="air-slide-body">{children}</div>
        {innerDrawer && (
            <Drawer
                width={innerDrawerWidth}
                open={showInnerDrawer}
                destroyOnHidden={true}
                maskClosable={true}
                onClose={onInnerClose}
                closable={false}
                styles={{
                  body: {
                    paddingTop: 0,
                    paddingBottom: 0,
                    paddingLeft: bodyPadding,
                    paddingRight: bodyPadding,
                  },
                }}
            >
              {innerDrawer}
            </Drawer>
        )}
      </Drawer>
  )
}

export default SlidePanel
