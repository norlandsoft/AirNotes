import React, {useEffect, useState} from 'react';
import {connect} from 'umi';
import {Button, Message, Form, Input, InputNumber} from 'air-design';
import '../SettingsPanel.less';

/**
 * 缓存 Redis 设置面板
 *
 * @author ChaiMingXu
 * @since 2026/5/26
 */
const RedisSettingsPanel: React.FC<any> = (props) => {
  const {dispatch, frameSize} = props;
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const contentHeight = (frameSize?.height || 600) - 60;

  useEffect(() => {
    setLoading(true);
    dispatch({
      type: 'paas/fetchRedisConfig',
      callback: (resp: any) => {
        setLoading(false);
        if (resp?.success && resp?.data) {
          const d = resp.data;
          form.setFieldsValue({
            host: d.host ?? 'localhost',
            port: d.port ?? 6379,
            password: d.password ?? '',
            database: d.database ?? 0,
          });
        } else {
          form.setFieldsValue({
            host: 'localhost',
            port: 6379,
            password: '',
            database: 0,
          });
        }
      },
    });
  }, [dispatch]);

  const onFinish = (values: any) => {
    setSaving(true);
    dispatch({
      type: 'paas/saveRedisConfig',
      payload: {
        host: values.host,
        port: values.port,
        password: values.password,
        database: values.database,
      },
      callback: (resp: any) => {
        setSaving(false);
        if (resp?.success) {
          Message.success('保存成功');
        } else {
          Message.error(resp?.message || '保存失败');
        }
      },
    });
  };

  return (
    <div className="air-grid-panel">
      <div className="air-grid-panel-top">
        <div className="air-grid-panel-title">缓存 Redis</div>
        <div className="air-grid-panel-toolbar">
          <Button type="primary" onClick={() => form.submit()} disabled={saving || loading}>
            {saving ? '保存中...' : '保存配置'}
          </Button>
        </div>
      </div>
      <div className="admin-paas-panel-content" style={{height: contentHeight, overflow: 'auto'}}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            host: 'localhost',
            port: 6379,
            password: '',
            database: 0,
          }}
          style={{maxWidth: 640, padding: '0 24px 24px'}}
          disabled={loading}
        >
          <Form.Item label="主机" name="host" rules={[{required: true, message: '请输入主机地址'}]}>
            <Input placeholder="如 localhost 或 127.0.0.1"/>
          </Form.Item>
          <Form.Item label="端口" name="port" rules={[{required: true, message: '请输入端口'}]}>
            <InputNumber min={1} max={65535} placeholder="默认 6379" style={{width: '100%'}}/>
          </Form.Item>
          <Form.Item label="密码" name="password">
            <Input.Password placeholder="留空表示无密码" autoComplete="new-password"/>
          </Form.Item>
          <Form.Item label="数据库索引" name="database">
            <InputNumber min={0} max={15} placeholder="0-15，默认 0" style={{width: '100%'}}/>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default connect(({global}: any) => ({
  frameSize: global.frameSize,
}))(RedisSettingsPanel);
