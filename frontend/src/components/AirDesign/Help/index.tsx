import React from 'react'
import Icon from '../Icon'
import {Tooltip} from 'antd'

interface HelpProps {
  icon?: string
  size?: number
  text?: string
}

const Help: React.FC<HelpProps> = (props) => {
  const {icon = 'help', size = 14, text = ''} = props

  return (
      <Tooltip placement="top" title={text}>
        <div style={{width: size, height: size}}>
          <Icon name={icon} size={size}/>
        </div>
      </Tooltip>
  )
}

export default Help
