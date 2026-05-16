import React from 'react'

interface PaneProps {
  className: string
  children: React.ReactNode
  size?: string | number
  split?: 'vertical' | 'horizontal'
  style?: React.CSSProperties
  eleRef?: (ref: HTMLDivElement) => void
}

class Pane extends React.PureComponent<PaneProps> {
  render() {
    const {children, className, split, style: styleProps, size, eleRef} = this.props

    const classes = ['Pane', split, className]

    let style: React.CSSProperties = {
      flex: 1,
      position: 'relative',
      outline: 'none',
    }

    if (size !== undefined) {
      if (split === 'vertical') {
        style.width = size
      } else {
        style.height = size
        style.display = 'flex'
      }
      style.flex = 'none'
    }

    style = Object.assign({}, style, styleProps || {})

    return (
        <div ref={eleRef} className={classes.join(' ')} style={style}>
          {children}
        </div>
    )
  }
}

export default Pane
