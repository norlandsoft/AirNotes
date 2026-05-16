import {Spin} from 'antd'
import './index.less'

interface LoadingPanelProps {
  loading?: boolean
  message?: string
}

const LoadingPanel = ({loading = false, message = 'Loading ...'}: LoadingPanelProps) => {
  return (
      loading && (
          <div className={'air-loading-panel'}>
            <Spin spinning={loading} fullscreen={true} indicator={<></>}/>
            <div className="air-loading-panel-content">{message}</div>
          </div>
      )
  )
}

export default LoadingPanel
