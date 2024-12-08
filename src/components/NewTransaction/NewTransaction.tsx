import { useState, useEffect } from 'react';
import { Form, Select, Input, Button, Upload, message, Spin } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { projectsAPI, contractorsAPI, transactionsAPI } from '../../api';
import { metricsAPI } from '../../api';
import type { RcFile } from 'antd/es/upload/interface';
import { IndianNumberInput } from '../ProjectList/IndianNumberInput';

interface Project {
    projectId: string;
    name: string;
    contractors: string[];
    budget: number;
    dueDate: string;
}

interface Contractor {
    contractorId: string;
    name: string;
    email: string;
    phone: number;
}

interface NewTransactionProps {
    onTransactionSuccess?: () => void;
}

const NewTransaction: React.FC<NewTransactionProps> = ({ onTransactionSuccess }) => {
    const [form] = Form.useForm();
    const [projects, setProjects] = useState<Project[]>([]);
    const [contractors, setContractors] = useState<Contractor[]>([]);
    const [selectedProjectContractors, setSelectedProjectContractors] = useState<Contractor[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [fileString, setFileString] = useState<string>('');

    // Fetch projects and contractors on component mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [projectsRes, contractorsRes] = await Promise.all([
                    projectsAPI.getAll(),
                    contractorsAPI.getAll()
                ]);
                setProjects(projectsRes.data);
                setContractors(contractorsRes.data);
            } catch (error) {
                console.error('Error fetching data:', error);
                message.error('Failed to load projects and contractors');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Convert file to base64 string
    const convertFileToString = (file: RcFile): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    // Update available contractors when project is selected
    const onProjectSelect = async (projectId: string) => {
        try {
            setLoading(true);
            const response = await metricsAPI.getProjectContractors(projectId);
            setSelectedProjectContractors(response.data);
            form.resetFields(['contractor']);
        } catch (error) {
            console.error('Error fetching project contractors:', error);
            message.error('Failed to load contractors for this project');
        } finally {
            setLoading(false);
        }
    };

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            // Basic validation
            if (!values.transactionAmount || values.transactionAmount <= 0) {
                throw new Error('Invalid transaction amount');
            }

            const transactionData = {
                project: values.project,
                contractor: values.contractor,
                transactionAmount: Number(values.transactionAmount),
                transactionDate: new Date().toISOString().split('T')[0],
                transactionProof: fileString || 'No proof attached',
                signature: ''
            };

            console.log('Sending transaction data:', transactionData);

            const response = await transactionsAPI.create(transactionData);

            console.log('Transaction response:', response);

            message.success('Transaction created successfully');
            form.resetFields();
            setFileString('');
            onTransactionSuccess?.();
        } catch (error: any) {
            console.error('Error creating transaction:', error);
            message.error(error.response?.data?.message || 'Failed to create transaction. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <Spin spinning={loading}>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    scrollToFirstError
                >
                    <Form.Item
                        name="project"
                        label="Select Project"
                        rules={[{ required: true, message: 'Please select a project' }]}
                    >
                        <Select
                            placeholder="Select a project"
                            onChange={(value) => onProjectSelect(value)}
                        >
                            {projects.map(project => (
                                <Select.Option key={project.projectId} value={project.projectId}>
                                    {project.name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="contractor"
                        label="Select Contractor"
                        rules={[{ required: true, message: 'Please select a contractor' }]}
                    >
                        <Select
                            placeholder="Select a contractor"
                        >
                            {selectedProjectContractors.map(contractor => (
                                <Select.Option key={contractor.contractorId} value={contractor.contractorId}>
                                    {contractor.name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="transactionAmount"
                        label="Transaction Amount"
                        rules={[{ required: true, message: 'Please enter transaction amount' }]}
                    >
                        <IndianNumberInput />
                    </Form.Item>

                    <Form.Item
                        name="transactionProof"
                        label="Transaction Proof"
                        extra="Upload payment receipt or proof of transaction (Images or PDF only)"
                        rules={[{ required: false }]}
                    >
                        <Upload
                            beforeUpload={async (file) => {
                                const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf';
                                const isValidSize = file.size / 1024 / 1024 < 5;

                                if (!isValidType) {
                                    message.error('You can only upload image or PDF files!');
                                    return Upload.LIST_IGNORE;
                                }
                                if (!isValidSize) {
                                    message.error('File must be smaller than 5MB!');
                                    return Upload.LIST_IGNORE;
                                }

                                try {
                                    const fileStr = await convertFileToString(file);
                                    setFileString(fileStr);
                                } catch (error) {
                                    console.error('Error converting file:', error);
                                    message.error('Failed to process file');
                                    return Upload.LIST_IGNORE;
                                }

                                return false; // Prevent default upload behavior
                            }}
                            listType="picture"
                            maxCount={1}
                        >
                            <Button icon={<UploadOutlined />}>Upload Proof</Button>
                        </Upload>
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            Create Transaction
                        </Button>
                    </Form.Item>
                </Form>
            </Spin>
        </div>
    );
};

export default NewTransaction;