import {notification} from 'antd'
import './index.less'
import {IconType, NotificationPlacement} from 'antd/es/notification/interface'

interface NotificationOptions {
  title?: string
  message: string
  type?: IconType
  duration?: number
  position?: NotificationPlacement
  onClose?: () => void
}

const notice = (options: NotificationOptions) => {
  notification.open({
    message: options.title,
    description: options.message,
    duration: options.duration || 2,
    type: options.type || 'info',
    placement: options.position || 'bottomRight',
    style: options.title ? {} : {padding: '16px 16px 22px 16px'},
    onClose: options.onClose,
  })
}

const info = (options: NotificationOptions) => {
  notice({...options, type: 'info'})
}

const success = (options: NotificationOptions) => {
  notice({...options, type: 'success'})
}

const warn = (options: NotificationOptions) => {
  notice({...options, type: 'warning'})
}

const warning = (options: NotificationOptions) => {
  notice({...options, type: 'warning'})
}

const error = (options: NotificationOptions) => {
  notice({...options, type: 'error'})
}

export {info, success, warn, warning, error}
