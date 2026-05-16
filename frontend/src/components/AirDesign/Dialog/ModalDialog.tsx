import React from 'react'
import {Spin} from 'antd'
import Button from '../Button'
import Icon from '../Icon'
import './ModalDialog.less'

interface ModalDialogProps {
  visible?: boolean
  // ... 其他 props
  children?: React.ReactNode
  onInit?: (ref: ModalDialog) => void
  onCancel?: () => void
  domId?: string
  okText?: string
  onOk?: () => void
  cancelText?: string
  confirmable?: boolean
  closable?: boolean
  width?: number | string
  height?: number | string
  title?: React.ReactNode
  showFooter?: boolean
  headerColor?: string
  headerBgColor?: string
  contentBgColor?: string
  footerBgColor?: string
  mask?: boolean
  loading?: boolean
}

interface ModalDialogState {
  visible: boolean
  clientWidth: number
  clientHeight: number
  pageX: number
  pageY: number
  moving: boolean
  diffX?: number
  diffY?: number
}

class ModalDialog extends React.Component<ModalDialogProps, ModalDialogState> {
  constructor(props: ModalDialogProps) {
    super(props)
    const {visible} = this.props
    const {clientWidth, clientHeight} = document.documentElement
    this.state = {
      visible: !!visible,
      clientWidth,
      clientHeight,
      pageX: clientWidth / 3,
      pageY: clientHeight / 10,
      moving: false,
    }
  }

  UNSAFE_componentWillReceiveProps({visible}) {
    if (visible !== '' && visible !== null) {
      this.setState({visible})
    }
  }

  componentDidMount() {
    this.resize()
    if (this.props.onInit) {
      this.props.onInit(this)
    }
    window.addEventListener('resize', this.resize)
  }

  resize = () => {
    const {clientWidth, clientHeight} = document.documentElement
    // console.log(`监听到窗口大小变化 宽：${clientWidth} 高：${clientHeight}`)
    const modal = document.getElementById('modal')
    if (modal) {
      const pageY = (clientHeight - modal.offsetHeight) / 2
      const pageX = (clientWidth - modal.offsetWidth) / 2
      this.setState({clientWidth, clientHeight, pageX, pageY})
    }
  }

  doCancel = () => {
    const {onCancel, domId} = this.props
    if (onCancel) {
      onCancel()
    }

    this.setState({visible: false})
    // 删除dom
    const rootDiv = document.getElementById('root')
    if (rootDiv) {
      const dm = rootDiv.querySelector(`#${domId ? domId : 'air-modal-dialog'}`)
      if (dm) {
        rootDiv.removeChild(dm)
      }
    }
  }

  open = () => {
    this.setState({visible: true})
  }

  // 获取鼠标点击title时的坐标、title的坐标以及两者的位移
  getPosition = (e) => {
    // 标题DOM元素titleDom
    const titleDom = e.target
    // titleDom的坐标
    const X = titleDom.getBoundingClientRect().left
    const Y = titleDom.getBoundingClientRect().top
    // 鼠标点击的坐标
    let mouseX = 0,
        mouseY = 0
    if (e.pageX || e.pageY) {
      //ff,chrome等浏览器
      mouseX = e.pageX
      mouseY = e.pageY
    } else {
      mouseX = e.clientX + document.body.scrollLeft - document.body.clientLeft
      mouseY = e.clientY + document.body.scrollTop - document.body.clientTop
    }
    // 鼠标点击位置与modal的位移
    const diffX = mouseX - X
    const diffY = mouseY - Y
    return {X, Y, mouseX, mouseY, diffX, diffY}
  }

  /**
   * 鼠标按下，设置modal状态为可移动，并注册鼠标移动事件
   * 计算鼠标按下时，指针所在位与modal位置以及两者的差值
   **/
  onMouseDown = (e) => {
    const position = this.getPosition(e)
    window.onmousemove = this.onMouseMove
    this.setState({moving: true, diffX: position.diffX, diffY: position.diffY})
  }

  // 松开鼠标，设置modal状态为不可移动,
  onMouseUp = (e) => {
    this.setState({moving: false})
  }

  // 鼠标移动重新设置modal的位置
  onMouseMove = (e) => {
    const {moving, diffX = 0, diffY = 0} = this.state
    if (moving) {
      // 获取鼠标位置数据
      const position = this.getPosition(e)
      // 算modal应该随鼠标移动到的坐标
      const x = position.mouseX - diffX
      const y = position.mouseY - diffY
      // 窗口大小
      const {clientWidth, clientHeight} = document.documentElement
      const modal = document.getElementById('modal')
      if (modal) {
        // 计算modal坐标的最大值
        const maxHeight = clientHeight - modal.offsetHeight
        const maxWidth = clientWidth - modal.offsetWidth
        // 判断得出modal的最终位置，不得超出浏览器可见窗口
        const left = x > 0 ? (x < maxWidth ? x : maxWidth) : 0
        const top = y > 0 ? (y < maxHeight ? y : maxHeight) : 0
        this.setState({pageX: left, pageY: top})
      }
    }
  }

  render() {
    const {
      okText,
      onOk,
      cancelText,
      confirmable = true,
      closable = true,
      children,
      width,
      height,
      title,
      loading = false,
      mask = true,
      showFooter = true,
      headerColor = '#000',
      headerBgColor = '#f8f8f8',
      contentBgColor = '#fff',
      footerBgColor = '#fff',
    } = this.props
    const {visible, clientWidth, clientHeight, pageX, pageY} = this.state
    const modal = (
        <div
            className={mask ? 'custom_modal_mask' : 'custom_modal_normal'}
            style={{width: clientWidth, height: clientHeight}}
        >
          <div
              id="modal"
              className={'custom_modal_win'}
              style={{
                width: width ? width : clientWidth / 3,
                height: height ? height : 'unset',
                marginLeft: pageX,
                marginTop: pageY,
              }}
          >
            <div className={'custom_modal_header'} style={{backgroundColor: headerBgColor}}>
              <div
                  className={'custom_modal_header_inner'}
                  onMouseDown={this.onMouseDown}
                  onMouseUp={this.onMouseUp}
                  style={{color: headerColor}}
              >
                {title ? title : 'AirMachine'}
              </div>

              {closable ? (
                  <div className={'custom_modal_header_close'} onClick={this.doCancel}>
                    <Icon name="close" size={16}/>
                  </div>
              ) : null}
            </div>
            <div className={'custom_modal_content'} style={{backgroundColor: contentBgColor}}>
              <div className={'loading_mask'} style={{visibility: loading ? 'visible' : 'hidden'}}>
                <Spin size="large"/>
              </div>
              {children}
            </div>
            {showFooter && (
                <div className={'custom_modal_footer'} style={{backgroundColor: footerBgColor}}>
                  <div className={'custom_modal_footer_inner'}>
                    {confirmable ? (
                        <Button type="primary" onClick={onOk}>
                          {okText ? okText : '确定'}
                        </Button>
                    ) : null}
                    {closable ? (
                        <Button onClick={this.doCancel} style={{marginLeft: '10px'}}>
                          {cancelText ? cancelText : '取消'}
                        </Button>
                    ) : null}
                  </div>
                </div>
            )}
          </div>
        </div>
    )
    return <>{!visible ? null : modal}</>
  }
}

export default ModalDialog
