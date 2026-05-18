import React from "react";
import {Form, Input} from 'air-design';

const NewSpaceForm: React.FC<any> = props => {

  const {
    form
  } = props;

  return (
      <Form
          form={form}
          labelCol={{span: 4}}
          wrapperCol={{span: 20}}
      >
        <Form.Item
            label={'名称'}
            name={'name'}
        >
          <Input placeholder={'请输入文档空间名称'}/>
        </Form.Item>
      </Form>
  );
}

export default NewSpaceForm;
