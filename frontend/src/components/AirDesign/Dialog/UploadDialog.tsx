import React from 'react'
import {createRoot} from 'react-dom/client'
import UploadModalDialog from './UploadModalDialog'

const UploadDialog = (props) => {
  const domId = 'air-upload-dialog'

  const DialogContent = <UploadModalDialog {...props} />

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

export default UploadDialog
