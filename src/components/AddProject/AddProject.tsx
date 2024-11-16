//AddProject
import { useState } from 'react';
import { Modal, Form, Input, DatePicker, Button } from 'antd';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../Firebase';

interface Project {
    projectName: string;
    address?: string;
    contractorAssigned: string;
    dueDate: string;
}

const AddProject = () => {
    const [isModalVisible, setIsModalVisible] = useState(false);

    const showModal = () => {
        setIsModalVisible(true);
    };

    const handleModalSubmit = async (values: Project) => {
        try {
            await addDoc(collection(db, 'Projects'), values);
            setIsModalVisible(false);
        } catch (error) {
            console.error('Error adding project:', error);
        }
    };

    return (
        <div>
            <Button type="primary" onClick={showModal}>
                Add Project
            </Button>
            <Modal
                title="Add Project"
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
            >
                <Form onFinish={handleModalSubmit}>
                    <Form.Item name="projectName" label="Project Name" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="address" label="Address">
                        <Input />
                    </Form.Item>
                    <Form.Item name="contractorAssigned" label="Contractor Assigned" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="dueDate" label="Due Date" rules={[{ required: true }]}>
                        <DatePicker />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit">
                            Submit
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default AddProject;