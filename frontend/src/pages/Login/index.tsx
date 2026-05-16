import React from 'react';
import {connect} from 'umi';
import {Form, Input, Button, Spin} from 'antd';
import {SHA256} from 'crypto-js';
import './index.less';

const Login: React.FC<any> = props => {
  const {dispatch, loading} = props;
  const [form] = Form.useForm();

  const handleLogin = (values: any) => {
    dispatch({
      type: 'user/login',
      payload: {
        id: values.id,
        password: SHA256(values.password).toString()
      }
    });
  };

  return (
    <div className="air-login-container">
      <div className="air-login-card">
        <div className="air-login-title">AirNotes Wiki</div>
        <Form form={form} onFinish={handleLogin} size="large">
          <Form.Item name="id" rules={[{required: true, message: '请输入用户名'}]}>
            <Input placeholder="用户名"/>
          </Form.Item>
          <Form.Item name="password" rules={[{required: true, message: '请输入密码'}]}>
            <Input.Password placeholder="密码"/>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              登 录
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default connect(({user}) => ({
  loading: user.loading
}))(Login);
