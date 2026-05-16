import React from 'react'
import {createRoot, Root} from 'react-dom/client'
import {CheckCircleFilled, CloseCircleFilled, ExclamationCircleFilled, InfoCircleFilled,} from '@ant-design/icons'
import {ConfigProvider} from 'antd'
import './index.less'

type MessageType = 'info' | 'success' | 'error' | 'warning'

interface MessageItem {
  key: string
  content: React.ReactNode
  duration: number
  onClose?: () => void
  type: MessageType
}

const ICONS = {
  info: <InfoCircleFilled/>,
  success: <CheckCircleFilled/>,
  error: <CloseCircleFilled/>,
  warning: <ExclamationCircleFilled/>,
}

let container: HTMLDivElement | null = null
let root: Root | null = null
let messages: MessageItem[] = []

const getContainer = () => {
  if (!container) {
    container = document.createElement('div')
    container.className = 'air-message-container'
    document.body.appendChild(container)
    root = createRoot(container)
  }
  return container
}

const render = () => {
  if (!root) return

  const MessageComponent = () => (
      <ConfigProvider>
        {messages.map((msg) => (
            <div key={msg.key} className={`air-message-item air-message-item--${msg.type}`}>
              <span className="air-message-item__icon">{ICONS[msg.type]}</span>
              <span className="air-message-item__content">{msg.content}</span>
            </div>
        ))}
      </ConfigProvider>
  )

  root.render(<MessageComponent/>)
}

const showMessage = (
    type: MessageType,
    content: React.ReactNode,
    duration = 2,
    onClose?: () => void
): { key: string; destroy: () => void } => {
  const key = `msg_${Date.now()}_${Math.random()}`
  const item: MessageItem = {key, content, duration, onClose, type}

  messages = [...messages, item]
  getContainer()
  render()

  if (duration > 0) {
    setTimeout(() => {
      close(key)
    }, duration * 1000)
  }

  return {
    key,
    destroy: () => close(key),
  }
}

const close = (key: string) => {
  const closedItem = messages.find((m) => m.key === key)
  messages = messages.filter((m) => m.key !== key)
  render()
  closedItem?.onClose?.()
}

const destroyAll = () => {
  messages = []
  if (container && root) {
    root.unmount()
    container.remove()
    container = null
    root = null
  }
}

export default {
  info: (content: React.ReactNode, duration?: number, onClose?: () => void) =>
      showMessage('info', content, duration, onClose),
  success: (content: React.ReactNode, duration?: number, onClose?: () => void) =>
      showMessage('success', content, duration, onClose),
  error: (content: React.ReactNode, duration?: number, onClose?: () => void) =>
      showMessage('error', content, duration, onClose),
  warning: (content: React.ReactNode, duration?: number, onClose?: () => void) =>
      showMessage('warning', content, duration, onClose),
  destroy: (key?: string) => (key ? close(key) : destroyAll()),
  destroyAll,
}
