import React, {useEffect, useState} from 'react';
import {connect} from 'umi';
import {Button, Message, Form, Input, InputNumber} from 'air-design';
import '../SettingsPanel.less';

/**
 * 数据库设置面板
 *
 * @author ChaiMingXu
 * @since 2026/5/26
 */
const DatabaseSettingsPanel: React.FC<any> = (props) => {
  const {dispatch, frameSize} = props;
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const contentHeight = (frameSize?.height || 600) - 60;

  useEffect(() => {
    setLoading(true);
    dispatch({
      type: 'paas/fetchDatabaseConfig',
      callback: (resp: any) => {
        setLoading(false);
        if (resp?.success && resp?.data) {
          const d = resp.data;
          form.setFieldsValue({
            host: d.host ?? 'localhost',
            port: d.port ?? 5432,
            database: d.database ?? 'air_notes',
            schema: d.schema ?? 'public',
            username: d.username ?? '',
            password: d.password ?? '',
          });
        } else {
          form.setFieldsValue({
            host: 'localhost',
            port: 5432,
            database: 'air_notes',
            schema: 'public',
            username: '',
            password: '',
          });
        }
      },
    });
  }, [dispatch]);

  const onFinish = (values: any) => {
    setSaving(true);
    dispatch({
      type: 'paas/saveDatabaseConfig',
      payload: {
        driver: 'postgresql',
        host: values.host,
        port: values.port,
        database: values.database,
        schema: values.schema || 'public',
        username: values.username,
        password: values.password,
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
        <div className="air-grid-panel-title">数据库连接</div>
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
            port: 5432,
            database: 'air_notes',
            schema: 'public',
            username: '',
            password: '',
          }}
          style={{maxWidth: 640, padding: '0 24px 24px'}}
          disabled={loading}
        >
          <Form.Item label="主机" name="host" rules={[{required: true, message: '请输入主机地址'}]}>
            <Input placeholder="如 localhost 或 127.0.0.1"/>
          </Form.Item>
          <Form.Item label="端口" name="port" rules={[{required: true, message: '请输入端口'}]}>
            <InputNumber min={1} max={65535} placeholder="如 5432" style={{width: '100%'}}/>
          </Form.Item>
          <Form.Item label="数据库名" name="database" rules={[{required: true, message: '请输入数据库名'}]}>
            <Input placeholder="如 air_notes"/>
          </Form.Item>
          <Form.Item label="Schema" name="schema">
            <Input placeholder="默认 public"/>
          </Form.Item>
          <Form.Item label="用户名" name="username">
            <Input placeholder="数据库用户名"/>
          </Form.Item>
          <Form.Item label="密码" name="password">
            <Input.Password placeholder="数据库密码" autoComplete="new-password"/>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default connect(({global}: any) => ({
  frameSize: global.frameSize,
}))(DatabaseSettingsPanel);
