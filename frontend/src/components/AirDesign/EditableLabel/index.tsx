import React, {useEffect, useRef, useState} from 'react'
import {Input, Space} from 'antd'
import Icon from '../Icon'
import './index.less'

/**
 * 可编辑标签组件
 * 功能：当鼠标悬停在标签上时显示编辑按钮，点击后可以编辑标签内容
 * 作者：ChaiMingXu
 */
interface EditableLabelProps {
  /** 标签文本内容 */
  text: string
  /** 保存回调函数，参数为修改后的文本 */
  onSave?: (value: string) => void
  /** 自定义样式 */
  style?: React.CSSProperties
}

const EditableLabel: React.FC<EditableLabelProps> = (props) => {
  const {text, onSave, style} = props

  // 编辑状态
  const [editing, setEditing] = useState<boolean>(false)
  // 当前显示的文本
  const [currentText, setCurrentText] = useState<string>(text)
  // 编辑时的输入值
  const [inputValue, setInputValue] = useState<string>(text)
  // Input 引用，用于自动聚焦
  const inputRef = useRef<any>(null)
  // 标记是否正在点击操作按钮，用于防止 onBlur 触发
  const isClickingButton = useRef<boolean>(false)

  // 当外部 text 属性变化时，更新当前文本
  useEffect(() => {
    setCurrentText(text)
    setInputValue(text)
    // 如果正在编辑，则退出编辑状态
    if (editing) {
      setEditing(false)
    }
  }, [text])

  // 进入编辑模式时，自动聚焦到输入框
  useEffect(() => {
    if (editing && inputRef.current) {
      // 使用 setTimeout 确保 DOM 已渲染
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 0)
    }
  }, [editing])

  /**
   * 处理编辑按钮点击
   * 进入编辑状态，并初始化输入框的值
   */
  const handleEditClick = (): void => {
    setInputValue(currentText)
    setEditing(true)
  }

  /**
   * 处理确定按钮点击
   * 保存修改后的文本
   */
  const handleConfirm = (): void => {
    const trimmedValue = inputValue.trim()
    // 如果值为空，不保存
    if (!trimmedValue) {
      return
    }
    // 如果值没有变化，直接退出编辑状态
    if (trimmedValue === currentText) {
      setEditing(false)
      return
    }
    // 更新当前文本
    setCurrentText(trimmedValue)
    // 调用保存回调
    if (onSave) {
      onSave(trimmedValue)
    }
    // 退出编辑状态
    setEditing(false)
  }

  /**
   * 处理取消按钮点击
   * 恢复原始文本，退出编辑状态
   */
  const handleCancel = (): void => {
    setInputValue(currentText)
    setEditing(false)
  }

  /**
   * 处理输入框失焦事件
   * 当点击外部区域时，取消编辑
   */
  const handleInputBlur = (): void => {
    // 如果正在点击按钮，不处理 blur
    if (isClickingButton.current) {
      isClickingButton.current = false
      return
    }
    handleCancel()
  }

  /**
   * 处理输入框回车键
   * 按下回车时保存
   */
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleConfirm()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  return (
      <div className={'air-editable-label'} style={style}>
        {editing ? (
            // 编辑状态：显示输入框和操作按钮
            <div className={'air-editable-label-editor'}>
              <Space.Compact className="air-editable-label-compact">
                <Input
                    ref={inputRef}
                    className="air-editable-label-input"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    onBlur={handleInputBlur}
                />
                <div
                    className="air-editable-label-button air-editable-label-button-confirm"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      isClickingButton.current = true
                    }}
                    onClick={handleConfirm}
                    title="确定"
                >
                  <Icon name={'yes'} size={14}/>
                </div>
                <div
                    className="air-editable-label-button air-editable-label-button-cancel"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      isClickingButton.current = true
                    }}
                    onClick={handleCancel}
                    title="取消"
                >
                  <Icon name={'no'} size={12}/>
                </div>
              </Space.Compact>
            </div>
        ) : (
            // 显示状态：显示文本和编辑按钮（悬停时显示）
            <div className={'air-editable-label-label'}>
              <span>{currentText}</span>
              <div onClick={handleEditClick}>
                <div className="air-editable-label-edit-icon">
                  <Icon name={'edit'} size={16}/>
                </div>
              </div>
            </div>
        )}
      </div>
  )
}

export default EditableLabel
