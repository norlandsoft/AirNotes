import React from 'react'
import {polyfill} from 'react-lifecycles-compat'
import Pane from './Pane'
import Resizer, {RESIZER_DEFAULT_CLASSNAME} from './Resizer'
import {ReactComponent as ExpandIcon} from './icon_expand.svg';
import {ReactComponent as CollapseIcon} from './icon_collapse.svg';

import './toggle.less'

interface SplitPaneProps {
  allowResize?: boolean
  collapsible?: boolean
  togglePosition?: number
  children: React.ReactNode[]
  className?: string
  primary?: 'first' | 'second'
  minSize?: string | number
  maxSize?: string | number
  defaultSize?: string | number
  size?: string | number
  split?: 'vertical' | 'horizontal'
  onDragStarted?: () => void
  onDragFinished?: (draggedSize: number) => void
  onChange?: (newSize: number) => void
  onResize?: (newSize: number, collapsed: boolean) => void
  onResizerClick?: (e: React.MouseEvent) => void
  onResizerDoubleClick?: (e: React.MouseEvent) => void
  style?: React.CSSProperties
  resizerStyle?: React.CSSProperties
  paneClassName?: string
  pane1ClassName?: string
  pane2ClassName?: string
  paneStyle?: React.CSSProperties
  pane1Style?: React.CSSProperties
  pane2Style?: React.CSSProperties
  resizerClassName?: string
  step?: number
}

interface SplitPaneState {
  active: boolean
  resized: boolean
  collapsed: boolean
  pane1Size?: number
  pane2Size?: number
  position?: number
  draggedSize?: number
  instanceProps: {
    size?: string | number
  }
}

function unFocus(document: Document, window: Window): void {
  try {
    window.getSelection()?.removeAllRanges()
  } catch (e) {
  }
}

function getDefaultSize(
    defaultSize: string | number | undefined,
    minSize: string | number | undefined,
    maxSize: string | number | undefined,
    draggedSize: number | undefined
): number {
  if (typeof draggedSize === 'number') {
    const min = typeof minSize === 'number' ? minSize : 0
    const max = typeof maxSize === 'number' && maxSize >= 0 ? maxSize : Infinity
    return Math.max(min, Math.min(max, draggedSize))
  }
  if (defaultSize !== undefined) {
    return typeof defaultSize === 'string' ? parseFloat(defaultSize) : defaultSize
  }
  return typeof minSize === 'string' ? parseFloat(minSize || '0') : minSize || 0
}

function removeNullChildren(children: React.ReactNode[]): React.ReactNode[] {
  return React.Children.toArray(children).filter((c) => c)
}

class SplitPane extends React.Component<SplitPaneProps, SplitPaneState> {
  private splitPane: HTMLDivElement | null = null
  private pane1: HTMLDivElement | null = null
  private pane2: HTMLDivElement | null = null

  static defaultProps = {
    allowResize: true,
    collapsible: true,
    togglePosition: 24,
    minSize: 50,
    primary: 'first',
    split: 'vertical',
    paneClassName: '',
    pane1ClassName: '',
    pane2ClassName: '',
  }

  constructor(props: SplitPaneProps) {
    super(props)

    const {size, defaultSize, minSize, maxSize, primary} = props

    const initialSize =
        size !== undefined ? size : getDefaultSize(defaultSize, minSize, maxSize, undefined)

    this.state = {
      active: false,
      resized: false,
      collapsed: false,
      pane1Size: primary === 'first' ? (initialSize as number) : undefined,
      pane2Size: primary === 'second' ? (initialSize as number) : undefined,
      instanceProps: {
        size,
      },
    }
  }

  componentDidMount() {
    document.addEventListener('mouseup', this.onMouseUp)
    document.addEventListener('mousemove', this.onMouseMove)
    document.addEventListener('touchmove', this.onTouchMove)
    this.setState((prevState) => ({
      ...prevState,
      ...SplitPane.getSizeUpdate(this.props, this.state),
    }))
  }

  static getDerivedStateFromProps(nextProps: SplitPaneProps, prevState: SplitPaneState) {
    return SplitPane.getSizeUpdate(nextProps, prevState)
  }

  componentWillUnmount() {
    document.removeEventListener('mouseup', this.onMouseUp)
    document.removeEventListener('mousemove', this.onMouseMove)
    document.removeEventListener('touchmove', this.onTouchMove)
  }

  onMouseDown = (event: React.MouseEvent) => {
    const touch = {clientX: event.clientX, clientY: event.clientY}
    this.onTouchStart({
      touches: [touch],
      changedTouches: [touch],
      targetTouches: [touch],
    } as unknown as React.TouchEvent)
  }

  onTouchStart = (event: React.TouchEvent) => {
    const {allowResize, onDragStarted, split} = this.props
    if (allowResize) {
      unFocus(document, window)
      const position = split === 'vertical' ? event.touches[0].clientX : event.touches[0].clientY

      if (typeof onDragStarted === 'function') {
        onDragStarted()
      }
      this.setState({
        active: true,
        position,
      })
    }
  }

  private onMouseMove = (event: MouseEvent) => {
    const eventWithTouches = {
      touches: [{clientX: event.clientX, clientY: event.clientY}],
    }
    this.onTouchMove(eventWithTouches as any)
  }

  private onMouseUp = () => {
    const {allowResize, onDragFinished} = this.props
    const {active, draggedSize} = this.state
    if (allowResize && active) {
      if (typeof onDragFinished === 'function' && draggedSize !== undefined) {
        onDragFinished(draggedSize)
      }
      this.setState({active: false})
    }
  }

  private onTouchMove = (event: TouchEvent | React.TouchEvent) => {
    const {allowResize, maxSize, minSize, onChange, onResize, split, step} = this.props
    const {active, position} = this.state

    if (allowResize && active && position !== undefined) {
      unFocus(document, window)
      const isPrimaryFirst = this.props.primary === 'first'
      const ref = isPrimaryFirst ? this.pane1 : this.pane2
      const ref2 = isPrimaryFirst ? this.pane2 : this.pane1
      if (ref) {
        const node = ref
        const node2 = ref2

        if (node.getBoundingClientRect && node2) {
          const width = node.getBoundingClientRect().width
          const height = node.getBoundingClientRect().height
          const current = split === 'vertical' ? event.touches[0].clientX : event.touches[0].clientY
          const size = split === 'vertical' ? width : height
          let positionDelta = position - current
          if (step) {
            if (Math.abs(positionDelta) < step) {
              return
            }
            // Integer division
            // eslint-disable-next-line no-bitwise
            positionDelta = ~~(positionDelta / step) * step
          }
          let sizeDelta = isPrimaryFirst ? positionDelta : -positionDelta

          const pane1Order = parseInt(window.getComputedStyle(node).order)
          const pane2Order = parseInt(window.getComputedStyle(node2).order)
          if (pane1Order > pane2Order) {
            sizeDelta = -sizeDelta
          }

          let newMaxSize = maxSize
          if (maxSize !== undefined && typeof maxSize === 'number' && maxSize <= 0) {
            const splitPane = this.splitPane
            if (splitPane) {
              if (split === 'vertical') {
                newMaxSize = splitPane.getBoundingClientRect().width + maxSize
              } else {
                newMaxSize = splitPane.getBoundingClientRect().height + maxSize
              }
            }
          }

          let newSize = size - sizeDelta
          const newPosition = position - positionDelta

          const minSizeAsNumber = typeof minSize === 'string' ? parseFloat(minSize) : minSize || 0

          const newMaxSizeAsNumber =
              typeof newMaxSize === 'string' ? parseFloat(newMaxSize) : (newMaxSize ?? Infinity)

          if (newSize < minSizeAsNumber) {
            newSize = minSizeAsNumber
          } else if (maxSize !== undefined && newSize > newMaxSizeAsNumber) {
            newSize = newMaxSizeAsNumber
          } else {
            this.setState({
              position: newPosition,
              resized: true,
            })
          }

          if (onChange) onChange(newSize)
          if (onResize) onResize(newSize, this.state.collapsed)

          const newSizeAsNumber = typeof newSize === 'string' ? parseFloat(newSize) : newSize
          const newState = {
            draggedSize: newSizeAsNumber,
            [isPrimaryFirst ? 'pane1Size' : 'pane2Size']: newSizeAsNumber,
          } as const
          this.setState((prevState) => ({
            ...prevState,
            ...newState,
          }))
        }
      }
    }
  }

  static getSizeUpdate(props: SplitPaneProps, state: SplitPaneState) {
    const newState: Partial<SplitPaneState> = {}
    const {instanceProps} = state

    if (instanceProps.size === props.size && props.size !== undefined) {
      return {}
    }

    const newSize =
        props.size !== undefined
            ? props.size
            : getDefaultSize(props.defaultSize, props.minSize, props.maxSize, state.draggedSize)

    if (props.size !== undefined) {
      newState.draggedSize = typeof newSize === 'string' ? parseFloat(newSize) : newSize
    }

    const isPanel1Primary = props.primary === 'first'

    const newSizeAsNumber = typeof newSize === 'string' ? parseFloat(newSize) : newSize
    newState[isPanel1Primary ? 'pane1Size' : 'pane2Size'] = newSizeAsNumber
    newState[isPanel1Primary ? 'pane2Size' : 'pane1Size'] = undefined

    newState.instanceProps = {size: props.size}

    return newState
  }

  render() {
    const {
      allowResize,
      collapsible,
      children,
      className,
      onResizerClick,
      onResizerDoubleClick,
      paneClassName,
      pane1ClassName,
      pane2ClassName,
      paneStyle,
      pane1Style: pane1StyleProps,
      pane2Style: pane2StyleProps,
      resizerClassName,
      resizerStyle,
      split,
      style: styleProps,
      togglePosition,
    } = this.props

    const {pane1Size, pane2Size, collapsed} = this.state

    const disabledClass = allowResize ? '' : 'disabled'
    const resizerClassNamesIncludingDefault = resizerClassName
        ? `${resizerClassName} ${RESIZER_DEFAULT_CLASSNAME}`
        : resizerClassName

    const notNullChildren = removeNullChildren(children)

    const style: React.CSSProperties = {
      display: 'flex',
      flex: 1,
      position: 'relative' as const,
      outline: 'none',
      overflow: 'hidden',
      MozUserSelect: 'text',
      WebkitUserSelect: 'text',
      msUserSelect: 'text',
      userSelect: 'text',
      ...styleProps,
    }

    if (split === 'vertical') {
      Object.assign(style, {
        flexDirection: 'row',
        // left: 0,
        // right: 0,
      })
    } else {
      Object.assign(style, {
        // bottom: 0,
        flexDirection: 'column',
        minHeight: '100%',
        // top: 0,
        width: '100%',
      })
    }

    const classes = ['SplitPane', className, split, disabledClass]

    const pane1Style = {...paneStyle, ...pane1StyleProps}
    const pane2Style = {...paneStyle, ...pane2StyleProps}

    const pane1Classes = ['Pane1', paneClassName, pane1ClassName].join(' ')
    const pane2Classes = ['Pane2', paneClassName, pane2ClassName].join(' ')

    return (
        <div
            className={classes.join(' ')}
            ref={(node) => {
              this.splitPane = node
            }}
            style={style}
        >
          <Pane
              className={pane1Classes}
              key="pane1"
              eleRef={(node) => {
                this.pane1 = node
              }}
              size={collapsed ? 0 : pane1Size}
              split={split}
              style={pane1Style}
          >
            <div style={{display: collapsed ? 'none' : 'block'}}>{notNullChildren[0]}</div>
          </Pane>
          {!collapsed && (
              <Resizer
                  className={disabledClass}
                  onClick={onResizerClick}
                  onDoubleClick={onResizerDoubleClick}
                  onMouseDown={this.onMouseDown}
                  onTouchStart={this.onTouchStart}
                  onTouchEnd={this.onMouseUp}
                  key="resizer"
                  resizerClassName={resizerClassNamesIncludingDefault}
                  split={split}
                  style={resizerStyle || {}}
              />
          )}
          <Pane
              className={pane2Classes}
              key="pane2"
              eleRef={(node) => {
                this.pane2 = node
              }}
              size={pane2Size}
              split={split}
              style={pane2Style}
          >
            {notNullChildren[1]}
            {collapsible && split === 'vertical' && (
                <div
                    className="toggle-container"
                    style={{bottom: `${togglePosition}px`}}
                    onClick={() => {
                      const newCollapsed = !this.state.collapsed
                      this.setState({
                        collapsed: newCollapsed,
                      })
                      if (this.props.onResize) {
                        this.props.onResize(newCollapsed ? 0 : this.state.pane1Size || 0, newCollapsed)
                      }
                      if (this.props.onChange) {
                        this.props.onChange(newCollapsed ? -1 : this.state.pane1Size || 0)
                      }
                    }}
                >
                  <div className="toggle-icon" style={{left: collapsed ? '-5px' : '-7px'}}>
                    {collapsed ? <ExpandIcon/> : <CollapseIcon/>}
                  </div>
                </div>
            )}
          </Pane>
        </div>
    )
  }
}

polyfill(SplitPane)

export default SplitPane
