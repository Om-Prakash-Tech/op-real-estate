// AddContractor.tsx
import React from 'react';
import { Form, Input, Button, message } from 'antd';
import { contractorsAPI } from '../../api';
import './AddContractor.css';

interface AddContractorProps {
  onSuccess?: () => void;
}

const AddContractor: React.FC<AddContractorProps> = ({ onSuccess }) => {
  const [form] = Form.useForm();

  const onFinish = async (values: any) => {
    const newContractor = {
      name: values.name,
      phone: values.phone,
      email: values.email
    };

    try {
      await contractorsAPI.create(newContractor);
      message.success('Contractor added successfully!');
      form.resetFields();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error adding contractor:', error);
      message.error('Failed to add contractor. Please try again.');
    }
  };

  return (
    <div className="add-contractor-container">
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        className="contractor-form"
      >
        <Form.Item
          label="Contractor Name"
          name="name"
          rules={[{ required: true, message: 'Please input contractor name!' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="Phone Number"
          name="phone"
          rules={[{ required: true, message: 'Please input phone number!' }]}
        >
          <Input type="number" />
        </Form.Item>
        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: 'Please input email!' },
            { type: 'email', message: 'Please input a valid email!' }
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Add Contractor
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default AddContractor;