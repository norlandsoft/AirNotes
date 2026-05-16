import React from 'react'

export const RESIZER_DEFAULT_CLASSNAME = 'Resizer'

interface ResizerProps {
  className: string
  onClick?: (event: React.MouseEvent) => void
  onDoubleClick?: (event: React.MouseEvent) => void
  onMouseDown: (event: React.MouseEvent) => void
  onTouchStart: (event: React.TouchEvent) => void
  onTouchEnd: (event: React.TouchEvent) => void
  split?: 'vertical' | 'horizontal'
  style?: React.CSSProperties
  resizerClassName: string
}

class Resizer extends React.Component<ResizerProps> {
  static defaultProps = {
    resizerClassName: RESIZER_DEFAULT_CLASSNAME,
  }

  render() {
    const {
      className,
      onClick,
      onDoubleClick,
      onMouseDown,
      onTouchEnd,
      onTouchStart,
      resizerClassName,
      split,
      style,
    } = this.props
    const classes = [resizerClassName, split, className]

    return (
        <span
            role="presentation"
            className={classes.join(' ')}
            style={style}
            onMouseDown={(event) => onMouseDown(event)}
            onTouchStart={(event) => {
              event.preventDefault()
              onTouchStart(event)
            }}
            onTouchEnd={(event) => {
              event.preventDefault()
              onTouchEnd(event)
            }}
            onClick={(event) => {
              if (onClick) {
                event.preventDefault()
                onClick(event)
              }
            }}
            onDoubleClick={(event) => {
              if (onDoubleClick) {
                event.preventDefault()
                onDoubleClick(event)
              }
            }}
        />
    )
  }
}

export default Resizer
