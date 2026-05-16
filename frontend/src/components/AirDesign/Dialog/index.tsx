import React from 'react'
import {createRoot} from 'react-dom/client'
import {ConfigProvider} from 'antd'
import ModalDialog from './ModalDialog'

const Dialog = (props) => {
  const {title, content, width, message, onConfirm, onInit} = props

  const domId = 'air-modal-dialog'
  const dialogRef = React.createRef()

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm(dialogRef.current)
    }
  }

  const DialogContent = (
      <ConfigProvider prefixCls={'air'}>
        <ModalDialog {...props} ref={dialogRef} visible={true} domId={domId} onOk={handleConfirm}>
          <>{message}</>
          <>{content}</>
        </ModalDialog>
      </ConfigProvider>
  )

  // 在id为root的DOM上创建
  const rootDiv = document.getElementById('root')
  if (!rootDiv) {
    throw new Error('root DOM not found')
  }

  // 创建DOM，并在DOM上渲染对话框
  const AirDlgDom = document.createElement('div')
  AirDlgDom.setAttribute('id', domId)

  rootDiv.appendChild(AirDlgDom)

  const root = createRoot(AirDlgDom)
  root.render(DialogContent)
}

export default Dialog
