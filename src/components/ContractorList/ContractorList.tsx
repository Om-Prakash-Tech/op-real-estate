// ContractorList.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Modal, Form, Input, Select, message, Space, Card, Row, Col, Spin } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { contractorsAPI, metricsAPI } from '../../api';
import AddContractor from '../AddContractor/AddContractor';
import './contractor-list.css';
import { AxiosError } from 'axios';

interface Transaction {
    project: string;
    contractor: string;
    transactionAmount: number;
    transactionDate: string;
    transactionProof: string;
    signature: string;
}

interface Contractor {
    contractorId: string;
    name: string;
    phone: number;
    email: string;
    createdAt: string;
    updatedAt: string;
    transactions?: Transaction[];
}

const ContractorList: React.FC = () => {
    const navigate = useNavigate();
    const [contractors, setContractors] = useState<Contractor[]>([]);
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);
    const [form] = Form.useForm();

    const fetchContractorDetails = async (contractor: Contractor): Promise<Contractor> => {
        try {
            const transactionsResponse = await metricsAPI.getContractorTransactions(contractor.contractorId);
            return {
                ...contractor,
                transactions: transactionsResponse.data || []
            };
        } catch (error) {
            console.error('Error fetching contractor transactions:', error);
            return {
                ...contractor,
                transactions: []
            };
        }
    };

    const fetchContractors = async () => {
        try {
            const response = await contractorsAPI.getAll();
            const contractorsWithTransactions = await Promise.all(
                response.data.map(fetchContractorDetails)
            );
            const contractorsData = contractorsWithTransactions.map((contractor: Contractor) => ({
                key: contractor.contractorId,
                ...contractor
            }));
            setContractors(contractorsData);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching contractors:', error);
            message.error('Failed to fetch contractors');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContractors();
    }, []);

    const handleContractorClick = (contractor: Contractor) => {
        navigate(`/contractor-history/${contractor.contractorId}`, { state: contractor });
    };

    const columns = [
        {
            title: 'Contractor Name',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Phone Number',
            dataIndex: 'phone',
            key: 'phone',
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
    ];

    const handleEditSubmit = async (values: any) => {
        if (!selectedContractor) return;
        setLoading(true);

        try {
            await contractorsAPI.update(selectedContractor.contractorId, {
                name: selectedContractor.name,
                email: values.email,
                phone: values.phone
            });

            message.success('Contractor updated successfully');
            setShowEditModal(false);
            fetchContractors();
            setSelectedContractor(null);
            form.resetFields();
        } catch (error) {
            console.error('Error updating contractor:', error);
            message.error('Failed to update contractor');
        }
    };

    const handleDelete = async () => {
        if (!selectedContractor) return;

        try {
            console.log('Attempting to delete contractor:', selectedContractor.contractorId);
            const response = await contractorsAPI.delete(selectedContractor.contractorId);
            console.log('Delete response:', response);
            message.success('Contractor deleted successfully');
            setShowDeleteModal(false);
            setSelectedContractor(null);
            fetchContractors();
        } catch (error) {
            console.error('Detailed error deleting contractor:', error);

            // Narrow the error type
            if (error instanceof Error) {
                console.error('Error message:', error.message);
            }

            // Check if it's an Axios error
            if (isAxiosError(error)) {
                console.error('Error response:', error.response?.data);
                console.error('Error status:', error.response?.status);
                console.error('Error headers:', error.response?.headers);
            }

            message.error('Failed to delete contractor');
        }
    };

    // Helper function to check if the error is an AxiosError
    function isAxiosError(error: unknown): error is AxiosError {
        return (error as AxiosError).isAxiosError !== undefined;
    }



    const handleAddSuccess = useCallback(async () => {
        setShowAddModal(false);
        await fetchContractors();
    }, [fetchContractors]);

    const handleContractorSelect = (contractorId: string) => {
        const contractor = contractors.find((c) => c.contractorId === contractorId);
        if (contractor) {
            setSelectedContractor(contractor);
            form.setFieldsValue({
                email: contractor.email,
                phone: contractor.phone
            });
        }
    };


    const renderActionButtons = () => (
        <Space className='all-buttons' style={{ marginBottom: 16, width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
            <Space className='edit-delete'>
                <Button
                    icon={<EditOutlined />}
                    onClick={() => setShowEditModal(true)}
                >
                    Edit Contractor
                </Button>
                <Button
                    icon={<DeleteOutlined />}
                    danger
                    onClick={() => setShowDeleteModal(true)}
                >
                    Delete Contractor
                </Button>
            </Space>
            <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setShowAddModal(true)}
            >
                Add Contractor
            </Button>
        </Space>
    );


    const renderMobileCards = () => {
        return (
            <Row gutter={[16, 16]} className="mobile-cards">
                {contractors.map((contractor) => (
                    <Col xs={24} key={contractor.contractorId}>
                        <Card
                            className={`contractor-list-card ${selectedContractor?.contractorId === contractor.contractorId ? 'selected' : ''}`}
                            onClick={() => handleContractorClick(contractor)}
                        //onClick={() => handleContractorSelect(contractor.contractorId)}                            
                        >
                            <div className='card-header'>

                                <h3 className="contractor-name">{contractor.name}</h3>
                                <Space className="card-actions">
                                    <Button
                                        icon={<EditOutlined />}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleContractorSelect(contractor.contractorId);
                                            setShowEditModal(true);
                                        }}
                                    />
                                    <Button
                                        icon={<DeleteOutlined />}
                                        danger
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleContractorSelect(contractor.contractorId);
                                            setShowDeleteModal(true);
                                        }}
                                    />
                                </Space>
                            </div>
                            <div className="contractor-details">
                                <div className="detail-item">
                                    <span className="label">Phone:</span>
                                    <span className="value">{contractor.phone}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">Email:</span>
                                    <span className="value">{contractor.email}</span>
                                </div>
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>
        );
    };

    return (
        <div className="contractor-list-container">
            {/* Action buttons rendered consistently for both views */}
            {renderActionButtons()}

            {window.innerWidth <= 768 ? (
                <Spin spinning={loading} size="large" className='mobile-loading'>
                    {contractors.length > 0 ? renderMobileCards() : (
                        <div className="no-data">No Contractors found</div>)}
                </Spin>
            ) : (
                <Table
                    columns={columns}
                    dataSource={contractors}
                    loading={loading}
                    rowKey="contractorId"
                    pagination={false}
                    onRow={(record) => ({
                        onClick: () => handleContractorClick(record),
                        //onClick: () => handleContractorSelect(record.contractorId),
                        className: 'table-row-hover'
                    })}
                />
            )}

            {/* Edit Modal */}
            <Modal
                title="Edit Contractor"
                open={showEditModal}
                onCancel={() => {
                    setShowEditModal(false);
                    setSelectedContractor(null);
                    form.resetFields();
                }}
                footer={null}
                destroyOnClose
            >
                <Form form={form} onFinish={handleEditSubmit} layout="vertical">
                    <Form.Item
                        name="contractorId"
                        label="Select Contractor"
                        rules={[{ required: true, message: 'Please select a contractor' }]}
                    >
                        <Select
                            onChange={handleContractorSelect}
                            placeholder="Select a contractor"
                            value={selectedContractor?.contractorId}
                        >
                            {contractors.map((contractor) => (
                                <Select.Option key={contractor.contractorId} value={contractor.contractorId}>
                                    {contractor.name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                            { required: true, message: 'Please input email' },
                            { type: 'email', message: 'Please enter a valid email' }
                        ]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="phone"
                        label="Phone Number"
                        rules={[{ required: true, message: 'Please input phone number' }]}
                    >
                        <Input type="number" />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" disabled={!selectedContractor}>
                            Update Contractor
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Delete Modal */}
            <Modal
                title="Delete Contractor"
                open={showDeleteModal}
                onCancel={() => {
                    setShowDeleteModal(false);
                    setSelectedContractor(null);
                }}
                footer={null}
                destroyOnClose
            >
                <Form layout="vertical">
                    <Form.Item
                        label="Select Contractor"
                        rules={[{ required: true, message: 'Please select a contractor' }]}
                    >
                        <Select
                            onChange={handleContractorSelect}
                            placeholder="Select a contractor"
                            value={selectedContractor?.contractorId}
                        >
                            {contractors.map((contractor) => (
                                <Select.Option key={contractor.contractorId} value={contractor.contractorId}>
                                    {contractor.name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    {selectedContractor && (
                        <div style={{ marginBottom: 16 }}>
                            <p>Are you sure you want to delete this contractor?</p>
                            <p><strong>Name:</strong> {selectedContractor.name}</p>
                            <p><strong>Email:</strong> {selectedContractor.email}</p>
                            <p><strong>Phone:</strong> {selectedContractor.phone}</p>
                        </div>
                    )}
                    <Form.Item>
                        <Button
                            type="primary"
                            danger
                            onClick={handleDelete}
                            disabled={!selectedContractor}
                        >
                            Confirm Delete
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title="Add Contractor"
                open={showAddModal}
                onCancel={() => setShowAddModal(false)}
                footer={null}
                destroyOnClose
            >
                <AddContractor
                    onSuccess={handleAddSuccess}
                />
            </Modal>
        </div>
    );
};

export default ContractorList;
