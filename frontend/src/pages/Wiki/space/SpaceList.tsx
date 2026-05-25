import React, {useEffect, useRef, useState} from "react";
import {connect} from 'umi';
import {Card, Empty, Form, Input, Radio, Space} from 'air-design';
import {Button, Dialog, Icon, Message, Table} from 'air-design';
import styles from './SpaceList.less';

/**
 * Wiki工作空间列表页面
 *
 * 采用智能创作首页的样式，提供工作空间的综合管理功能：
 * - 工作空间列表展示与搜索
 * - 新建工作空间
 * - 编辑工作空间基本信息
 * - 点击工作空间进入工作空间详情
 *
 * Created by ChaiMingXu, on 2026-01-15
 */
const SpaceList: React.FC<any> = props => {
  const {
    dispatch,
    frameSize,
  } = props;

  // 表单引用
  const formRef = useRef<any>(null);
  // 搜索关键词
  const [searchKeyword, setSearchKeyword] = useState('');
  // 显示模式：card-卡片模式，list-列表模式
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  // 工作空间列表
  const [spaceList, setSpaceList] = useState<any[]>([]);

  useEffect(() => {
    loadSpaceList();
  }, []);

  /**
   * 加载工作空间列表
   */
  const loadSpaceList = () => {
    dispatch({
      type: 'wiki/fetchSpaces',
      payload: {},
      callback: (resp: any) => {
        if (resp.success) {
          setSpaceList(resp.data || []);
        } else {
          Message.error('加载失败: ' + (resp.message || '未知错误'));
        }
      }
    });
  };

  /**
   * 选中工作空间，进入工作空间
   * @param record 工作空间记录
   */
  const handleSelectSpace = (record: any) => {
    // 设置当前工作空间
    dispatch({
      type: 'wiki/setCurrentSpace',
      payload: record
    });
    // 记录到最近访问，同时会隐藏工作空间列表
    dispatch({
      type: 'wiki/addRecentSpace',
      payload: {spaceId: record.id},
    });
  };

  /**
   * 打开工作空间对话框（新建或编辑）
   * 使用 AirDesign Dialog 组件
   * @param space 工作空间记录，如果为null或undefined则表示新建
   */
  const openSpaceDialog = (space?: any) => {
    const isEdit = !!space;

    // 工作空间表单内容
    const SpaceForm = (
        <Form
            ref={formRef}
            layout="vertical"
            initialValues={space || {}}
        >
          <Form.Item
              name="name"
              label="工作空间名称"
              rules={[{required: true, message: '请输入工作空间名称'}]}
          >
            <Input placeholder="请输入工作空间名称" maxLength={100}/>
          </Form.Item>
          <Form.Item name="description" label="工作空间描述">
            <Input.TextArea rows={4} placeholder="请输入工作空间描述" maxLength={500}/>
          </Form.Item>
        </Form>
    );

    Dialog({
      title: isEdit ? '编辑工作空间' : '新建工作空间',
      width: 500,
      content: SpaceForm,
      okText: isEdit ? '保存' : '创建',
      cancelText: '取消',
      onConfirm: (dialogRef: any) => {
        // 获取表单数据并提交
        const form = formRef.current;
        if (form) {
          form.validateFields().then((values: any) => {
            if (isEdit) {
              // 编辑模式：更新工作空间
              dispatch({
                type: 'wiki/updateSpace',
                payload: {...space, ...values},
                callback: (resp: any) => {
                  if (resp.success) {
                    Message.success('工作空间更新成功');
                    dialogRef?.doCancel();
                    loadSpaceList();
                  } else {
                    Message.error('更新失败: ' + (resp.message || '未知错误'));
                  }
                }
              });
            } else {
              // 新建模式：创建工作空间
              dispatch({
                type: 'wiki/createSpace',
                payload: values,
                callback: (resp: any) => {
                  if (resp.success) {
                    Message.success('工作空间创建成功');
                    dialogRef?.doCancel();
                    loadSpaceList();
                  } else {
                    Message.error('创建失败: ' + (resp.message || '未知错误'));
                  }
                }
              });
            }
          }).catch(() => {
            // 表单验证失败
          });
        }
      }
    });
  };

  /**
   * 打开编辑对话框
   * @param record 工作空间记录
   * @param e 事件对象，用于阻止冒泡
   */
  const handleEdit = (record: any, e: React.MouseEvent) => {
    e.stopPropagation();
    openSpaceDialog(record);
  };


  /**
   * 过滤后的工作空间列表
   */
  const filteredList = spaceList.filter((item: any) => {
    if (!searchKeyword) return true;
    const keyword = searchKeyword.toLowerCase();
    return (
        item.name?.toLowerCase().includes(keyword) ||
        item.description?.toLowerCase().includes(keyword)
    );
  });

  return (
      <div className={styles.container} style={{height: frameSize?.height || 'auto'}}>
        {/* 工作空间列表区域 */}
        <Card
            className={styles.spaceListCard}
            title={
              <Space>
                <Icon name="note" size={18}/>
                <span>我的工作空间</span>
              </Space>
            }
            extra={
              <Space>
                <Form layout="inline">
                  <Form.Item style={{marginBottom: 0, marginTop: 0}}>
                    <Input
                        placeholder="搜索工作空间名称或描述"
                        prefix={<Icon name="search" size={16}/>}
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        style={{minWidth: 300}}
                        allowClear
                    />
                  </Form.Item>
                </Form>
                {/* 视图切换按钮 */}
                <Radio.Group
                    value={viewMode}
                    onChange={(e) => setViewMode(e.target.value)}
                    buttonStyle="solid"
                >
                  <Radio.Button value="card" title="卡片视图">
                    <Icon name="apps" size={14} />
                  </Radio.Button>
                  <Radio.Button value="list" title="列表视图">
                    <Icon name="menu" size={14} />
                  </Radio.Button>
                </Radio.Group>
                <Button onClick={loadSpaceList}>
                  <Icon name="reload" size={16}/>
                  刷新
                </Button>
                <Button type="primary" onClick={() => openSpaceDialog()}>
                  新建
                </Button>
              </Space>
            }
        >
          {filteredList.length > 0 ? (
              viewMode === 'card' ? (
                  // 卡片视图
                  <div className={styles.spaceGrid}>
                    {filteredList.map((space: any) => (
                        <div key={space.id} className={styles.spaceCardWrapper}>
                          <Card
                              className={styles.spaceCard}
                              hoverable
                              onClick={() => handleSelectSpace(space)}
                          >
                            {/* 编辑按钮，位于卡片右上方 */}
                            <span
                                className={styles.editBtn}
                                onClick={(e) => handleEdit(space, e)}
                                title="编辑"
                            >
                              <Icon name="edit" size={14}/>
                            </span>
                            <Card.Meta
                                title={
                                  <Space>
                                    <Icon name="note" size={16}/>
                                    <span>{space.name}</span>
                                  </Space>
                                }
                                description={
                                  <div className={styles.spaceCardDesc}>
                                    <p className={styles.descText}>{space.description || '暂无描述'}</p>
                                    <p className={styles.createTime}>创建于 {space.createTime || '-'}</p>
                                  </div>
                                }
                            />
                          </Card>
                        </div>
                    ))}
                  </div>
              ) : (
                  // 列表视图
                  <Table
                      data={filteredList}
                      height={400}
                      rowHeight={60}
                      pagination={false}
                      showEmpty
                      emptyText="暂无工作空间"
                      onItemClick={(record: any) => handleSelectSpace(record)}
                      columns={[
                        {
                          title: '工作空间',
                          dataIndex: 'name',
                          render: (text: string, record: any) => (
                              <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                                <Icon name="note" size={20}/>
                                <div>
                                  <div style={{fontWeight: 500}}>{text}</div>
                                  <div style={{color: '#999', fontSize: 12, marginTop: 2}}>
                                    {record.description || '暂无描述'}
                                  </div>
                                </div>
                              </div>
                          ),
                        },
                        {
                          title: '创建时间',
                          dataIndex: 'createTime',
                          width: 220,
                          render: (time: string) => time || '-',
                        },
                        {
                          title: '操作',
                          width: 120,
                          render: (_: any, record: any) => (
                              <Space>
                                <Button
                                    type="text"
                                    onClick={(e: React.MouseEvent) => {
                                      e.stopPropagation();
                                      handleEdit(record, e);
                                    }}
                                >
                                  <Icon name="edit" size={14}/> 编辑
                                </Button>
                              </Space>
                          ),
                        },
                      ]}
                  />
              )
          ) : (
              <Empty
                  description={searchKeyword ? '没有找到匹配的工作空间' : '暂无工作空间，点击"新建"创建'}
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
          )}
        </Card>
      </div>
  );
}

export default connect(({global, wiki}) => ({
  frameSize: global.frameSize,
  wiki
}))(SpaceList);
