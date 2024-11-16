import React, { useState, useEffect } from 'react';
import {
    Table,
    Button,
    Modal,
    Form,
    Input,
    Select,
    message,
    Card,
    Row,
    Col,
    Space,
    Radio,
    Alert
} from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useMediaQuery } from '@mui/material';
import { dealsAPI } from '../../api';
import './buy-sell.css';

interface PropertyDeal {
    dealId: string;
    name: string;
    phone: string;
    projectName: string;
    dealType: 'buy' | 'sell';
    transactionAmount: number;
    dealAmount: number;
    transactionDate: string;
    createdAt: string;
    updatedAt: string;
}

const BuySell = () => {
    const [deals, setDeals] = useState<PropertyDeal[]>([]);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [selectedDeal, setSelectedDeal] = useState<PropertyDeal | null>(null);
    const [customers, setCustomers] = useState<string[]>([]);
    const [editForm] = Form.useForm();
    const isMobile = useMediaQuery('(max-width:768px)');

    const fetchDeals = async () => {
        try {
            const response = await dealsAPI.getAll();
            const dealsData = response.data.map((deal: PropertyDeal) => ({
                key: deal.dealId,
                ...deal
            }));
            setDeals(dealsData);
            const getUniqueCustomers = (deals: PropertyDeal[]): string[] => {
                return Array.from(new Set(deals.map(deal => deal.name)));
            };

            const uniqueCustomers = getUniqueCustomers(dealsData);
            setCustomers(uniqueCustomers);
        } catch (error) {
            console.error('Error fetching deals:', error);
            message.error('Failed to fetch deals');
        }
    };

    useEffect(() => {
        fetchDeals();
    }, []);

    const columns = [
        {
            title: 'Customer Name',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Project Name',
            dataIndex: 'projectName',
            key: 'projectName',
        },
        {
            title: 'Customer Number',
            dataIndex: 'phone',
            key: 'phone',
        },
        {
            title: 'Transaction Type',
            dataIndex: 'dealType',
            key: 'dealType',
            render: (type: string) => type.charAt(0).toUpperCase() + type.slice(1),
        },
        {
            title: 'Transaction Amount',
            dataIndex: 'transactionAmount',
            key: 'transactionAmount',
            render: (amount: number) => amount?.toLocaleString(),
        },
        {
            title: 'Total Deal Amount',
            dataIndex: 'dealAmount',
            key: 'dealAmount',
            render: (amount: number) => amount?.toLocaleString(),
        },
    ];

    const handleEditClick = (deal: PropertyDeal) => {
        setSelectedDeal(deal);
        editForm.setFieldsValue({
            ...deal,
            dealType: deal.dealType.toLowerCase(),
        });
        setIsEditModalVisible(true);
    };

    const handleEditSubmit = async (values: any) => {
        try {
            if (!selectedDeal) return;

            const updatedDeal = {
                ...values,
                transactionAmount: Number(values.transactionAmount),
                dealAmount: Number(values.dealAmount),
                transactionDate: new Date().toISOString(),
            };

            await dealsAPI.update(selectedDeal.dealId, updatedDeal);
            message.success('Deal updated successfully');
            setIsEditModalVisible(false);
            editForm.resetFields();
            setSelectedDeal(null);
            fetchDeals();
        } catch (error) {
            console.error('Error updating deal:', error);
            message.error('Failed to update deal');
        }
    };

    const handleDelete = async () => {
        try {
            if (!selectedDeal) return;

            await dealsAPI.delete(selectedDeal.dealId);
            message.success('Deal deleted successfully');
            setIsDeleteModalVisible(false);
            setSelectedDeal(null);
            fetchDeals();
        } catch (error) {
            console.error('Error deleting deal:', error);
            message.error('Failed to delete deal');
        }
    };

    const handleCustomerSelect = (customerName: string) => {
        const selectedCustomerDeal = deals.find(deal => deal.name === customerName);
        if (selectedCustomerDeal) {
            editForm.setFieldsValue(selectedCustomerDeal);
        }
    };

    const renderMobileCard = (deal: PropertyDeal) => (
        <Col xs={24} key={deal.dealId}>
            <Card className="deal-card">
                <div className="card-header">
                    <h3>{deal.name}</h3>
                    <Space>
                        <Button
                            icon={<EditOutlined />}
                            onClick={() => handleEditClick(deal)}
                        />
                        <Button
                            icon={<DeleteOutlined />}
                            danger
                            onClick={() => {
                                setSelectedDeal(deal);
                                setIsDeleteModalVisible(true);
                            }}
                        />
                    </Space>
                </div>
                <div className="deal-details">
                    <p><strong>Project:</strong> {deal.projectName}</p>
                    <p><strong>Phone:</strong> {deal.phone}</p>
                    <p><strong>Type:</strong> {deal.dealType}</p>
                    <p><strong>Amount:</strong> {deal.transactionAmount.toLocaleString()}</p>
                    <p><strong>Total Deal:</strong> {deal.dealAmount.toLocaleString()}</p>
                </div>
            </Card>
        </Col>
    );

    return (
        <div className="buy-sell-container">
            {!isMobile ? (
                <>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                        <Space>
                            <Button
                                icon={<EditOutlined />}
                                onClick={() => {
                                    if (deals.length > 0) {
                                        setSelectedDeal(deals[0]);
                                        editForm.setFieldsValue(deals[0]);
                                        setIsEditModalVisible(true);
                                    }
                                }}
                            >
                                Edit Deal
                            </Button>
                            <Button
                                icon={<DeleteOutlined />}
                                danger
                                onClick={() => {
                                    if (deals.length > 0) {
                                        setSelectedDeal(deals[0]);
                                        setIsDeleteModalVisible(true);
                                    }
                                }}
                            >
                                Delete Deal
                            </Button>
                        </Space>
                    </div>
                    <Table
                        columns={columns}
                        dataSource={deals}
                        pagination={false}
                        className="deals-table"
                        onRow={(record) => ({
                            onClick: () => {
                                setSelectedDeal(record);
                                editForm.setFieldsValue(record);
                            },
                            style: { cursor: 'pointer' }
                        })}
                    />
                </>
            ) : (
                <Row gutter={[16, 16]} className="mobile-cards">
                    {deals.map(renderMobileCard)}
                </Row>
            )}

            {/* Edit Modal */}
            <Modal
                title="Edit Deal"
                open={isEditModalVisible}
                onCancel={() => {
                    setIsEditModalVisible(false);
                    editForm.resetFields();
                    setSelectedDeal(null);
                }}
                footer={null}
            >
                <Form
                    form={editForm}
                    onFinish={handleEditSubmit}
                    layout="vertical"
                >
                    <Form.Item
                        name="name"
                        label="Customer Name"
                        rules={[{ required: true }]}
                    >
                        <Select
                            onChange={handleCustomerSelect}
                            dropdownRender={(menu) => (
                                <>
                                    {menu}
                                    <Input
                                        placeholder="Edit customer name"
                                        onChange={(e) => editForm.setFieldValue('name', e.target.value)}
                                    />
                                </>
                            )}
                        >
                            {customers.map(customer => (
                                <Select.Option key={customer} value={customer}>
                                    {customer}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="projectName"
                        label="Project Name"
                        rules={[{ required: true }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="phone"
                        label="Customer Number"
                        rules={[{ required: true }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="dealType"
                        label="Transaction Type"
                        rules={[{ required: true }]}
                    >
                        <Radio.Group>
                            <Radio value="buy">Buy</Radio>
                            <Radio value="sell">Sell</Radio>
                        </Radio.Group>
                    </Form.Item>

                    <Form.Item
                        name="transactionAmount"
                        label="Transaction Amount"
                        rules={[{ required: true }]}
                    >
                        <Input type="number" />
                    </Form.Item>

                    <Form.Item
                        name="dealAmount"
                        label="Total Deal Amount"
                        rules={[{ required: true }]}
                    >
                        <Input type="number" />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit">
                            Update Deal
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Delete Modal */}
            <Modal
                title="Delete Deal"
                open={isDeleteModalVisible}
                onCancel={() => {
                    setIsDeleteModalVisible(false);
                    setSelectedDeal(null);
                }}
                footer={null}
            >
                <Form layout="vertical">
                    <Form.Item
                        name="dealSelect"
                        label="Select Deal to Delete"
                        rules={[{ required: true, message: 'Please select a deal!' }]}
                    >
                        <Select
                            placeholder="Select a deal"
                            onChange={(value) => {
                                const deal = deals.find(d => d.dealId === value);
                                setSelectedDeal(deal || null);
                            }}
                            value={selectedDeal?.dealId}
                        >
                            {deals.map((deal) => (
                                <Select.Option key={deal.dealId} value={deal.dealId}>
                                    {deal.name} - {deal.projectName}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    {selectedDeal && (
                        <div style={{ marginTop: '16px' }}>
                            <Alert
                                message="Delete Confirmation"
                                description={
                                    <div>
                                        <p>Are you sure you want to delete the following deal?</p>
                                        <ul style={{ marginTop: '8px' }}>
                                            <li><strong>Customer Name:</strong> {selectedDeal.name}</li>
                                            <li><strong>Project Name:</strong> {selectedDeal.projectName}</li>
                                            <li><strong>Transaction Type:</strong> {selectedDeal.dealType}</li>
                                            <li><strong>Amount:</strong> {selectedDeal.transactionAmount.toLocaleString()}</li>
                                        </ul>
                                    </div>
                                }
                                type="warning"
                                showIcon
                            />

                            <div style={{ marginTop: '16px', textAlign: 'right' }}>
                                <Space>
                                    <Button onClick={() => setIsDeleteModalVisible(false)}>
                                        Cancel
                                    </Button>
                                    <Button
                                        danger
                                        type="primary"
                                        onClick={handleDelete}
                                    >
                                        Delete Deal
                                    </Button>
                                </Space>
                            </div>
                        </div>
                    )}
                </Form>
            </Modal>
        </div>
    );
};

export default BuySell;