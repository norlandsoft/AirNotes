import React from 'react'
import Icon from '../Icon'
import styles from './ToggleButton.less'

interface ToggleButtonProps {
  icon: string
  size?: number
  shape: 'circle' | 'square' | 'default'
  selected: boolean
  onClick: () => void
  border?: boolean
  borderColor?: string
  selectedColor?: string
  unselectedColor?: string
}

const ToggleButton: React.FC<ToggleButtonProps> = (props) => {
  const {
    icon,
    size = 24,
    shape = 'default',
    selected,
    onClick,
    border = false,
    borderColor = '#ddd',
    selectedColor = '#ccddee',
    unselectedColor = 'transparent',
  } = props

  const borderStyle = border ? '1px solid ' + borderColor : '1px solid transparent'
  const borderRadius = shape === 'circle' ? '50%' : '3px'

  const handleButtonClick = () => {
    if (onClick) onClick()
  }

  return (
      <div
          className={styles.airToggleButton}
          style={{
            height: size,
            width: size,
            border: selected ? '1px solid #888' : borderStyle,
            borderRadius: borderRadius,
            backgroundColor: selected ? selectedColor : unselectedColor,
          }}
          onClick={handleButtonClick}
      >
        <Icon name={icon} size={size - 12}/>
      </div>
  )
}

export default ToggleButton
