import React, {useEffect, useRef, useState} from 'react'
import {Upload} from 'antd'
import {RcFile} from 'antd/lib/upload'
import Icon from '../Icon'
import ModalDialog from './ModalDialog'
import {error, info, success} from '../Notification'
import './UploadModalDialog.less'

const {Dragger} = Upload

const UploadModalDialog = (props) => {
  const dialogRef = useRef<any>()
  const [fileList, setFileList] = useState<RcFile[]>([])
  const [uploading, setUploading] = useState(false)

  const {
    url = '/upload', // 上传文件的URL
    onFileSaved,
    multiple = true,
    bucket = '',
    ownerType = 'file', // file, image, video, audio
    ownerId = '',
  } = props

  // 根据multiple属性动态设置CSS变量
  useEffect(() => {
    const height = multiple ? '220px' : '42px'
    const border = multiple ? '1px solid #e8e8e8' : 'none'
    document.documentElement.style.setProperty('--upload-list-height', height)
    document.documentElement.style.setProperty('--upload-list-border', border)
    // 组件卸载时清理CSS变量
    return () => {
      document.documentElement.style.removeProperty('--upload-list-height')
      document.documentElement.style.removeProperty('--upload-list-border')
    }
  }, [multiple])

  const confirmUpload = () => {
    const formData = new FormData()
    fileList.forEach((file) => {
      formData.append('files', file)
    })
    // FileMeta中的字段
    formData.append('bucket', bucket)
    formData.append('ownerType', ownerType)
    formData.append('ownerId', ownerId)

    if (fileList.length === 0) {
      info({
        message: '请选择要上传的文件',
      })
      return
    }

    setUploading(true)

    fetch(url, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + sessionStorage.getItem('air-machine-token'),
      },
      body: formData,
    })
        .then((response) => response.json())
        .then((resp) => {
          if (resp.success) {
            setFileList([])
            setUploading(false)
            success({
              message: '文件上传成功',
            })
            if (onFileSaved) onFileSaved(resp)
            // 关闭对话框
            dialogRef.current?.doCancel()
          } else {
            setUploading(false)
            error({
              title: '无法上传文件',
              message: resp.message,
            })
          }
        })
        .catch((err) => {
          setUploading(false)
          error({
            message: '文件上传失败',
          })
        })
  }

  const uploadProps = {
    multiple: multiple,
    onRemove: (file) => {
      setFileList((list) => {
        const index = list.indexOf(file)
        const newFileList = list.slice()
        newFileList.splice(index, 1)
        return newFileList
      })
    },
    beforeUpload: (file) => {
      if (multiple) {
        setFileList((list) => {
          return [...list, file]
        })
      } else {
        setFileList([file])
      }

      return false
    },
    fileList,
    ...props,
  }

  return (
      <ModalDialog
          ref={dialogRef}
          visible={true}
          title="文件上传"
          width={600}
          onOk={confirmUpload}
          domId={'air-upload-dialog'}
          mask={true}
          loading={uploading}
      >
        <Dragger {...uploadProps}>
          <div className={'ant-upload-drag-container-content'}>
            <Icon name={'upload'} size={22} color={'var(--primary-color)'}/>
            <p className={'ant-upload-drag-container-content-text'}>点击或将文件拖拽到此处上传</p>
          </div>
        </Dragger>
      </ModalDialog>
  )
}

export default UploadModalDialog
