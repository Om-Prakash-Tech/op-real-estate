import React, { useState, useEffect, useRef } from 'react';
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
    Alert,
    Spin,
    Checkbox,
    Upload,
    Image
} from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { useMediaQuery } from '@mui/material';
import SignatureCanvas from 'react-signature-canvas';
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
    status: 'verified' | 'unverified';
    signature: string;
    paymentReceipt: string;
}

const BuySell = () => {
    const [deals, setDeals] = useState<PropertyDeal[]>([]);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [isNewTransactionModalVisible, setIsNewTransactionModalVisible] = useState(false);
    const [isSignatureModalVisible, setIsSignatureModalVisible] = useState(false);
    const [selectedDeal, setSelectedDeal] = useState<PropertyDeal | null>(null);
    const [customers, setCustomers] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [confirmChecked, setConfirmChecked] = useState(false);
    const [uploadedImage, setUploadedImage] = useState<string>('');

    const signatureRef = useRef<SignatureCanvas>(null);
    const [editForm] = Form.useForm();
    const [newTransactionForm] = Form.useForm();
    const isMobile = useMediaQuery('(max-width:768px)');

    const fetchDeals = async () => {
        setLoading(true);
        try {
            const response = await dealsAPI.getAll();
            const dealsData = response.data.map((deal: PropertyDeal) => ({
                key: deal.dealId,
                ...deal,
                // Ensure status is set if it's missing in the database
                status: deal.status || 'unverified'
            }));
            setDeals(dealsData);
            const uniqueCustomers: string[] = Array.from(new Set(dealsData.map((deal: PropertyDeal) => deal.name)));
            setCustomers(uniqueCustomers);
        } catch (error) {
            console.error('Error fetching deals:', error);
            message.error('Failed to fetch deals');
        } finally {
            setLoading(false);
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
            title: 'Transaction Type',
            dataIndex: 'dealType',
            key: 'dealType',
            render: (type: string) => type.charAt(0).toUpperCase() + type.slice(1),
        },
        {
            title: 'Transaction Amount',
            dataIndex: 'transactionAmount',
            key: 'transactionAmount',
            render: (amount: number) => `₹${amount?.toLocaleString()}`,
        },
        {
            title: 'Total Deal Amount',
            dataIndex: 'dealAmount',
            key: 'dealAmount',
            render: (amount: number) => `₹${amount?.toLocaleString()}`,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string, record: PropertyDeal) => {
                return (
                    <a
                        onClick={() => handleStatusClick(record)}
                        style={{
                            color: record.status === 'unverified' ? '#1890ff' : '#52c41a',
                            cursor: record.status === 'unverified' ? 'pointer' : 'default',
                        }}
                    >
                        {record.status || 'unverified'}
                    </a >
                );
            },
        },
        {
            title: 'Signature',
            dataIndex: 'signature',
            key: 'signature',
            render: (signature: string) =>
                signature ? (
                    <Image
                        src={signature}
                        alt="Signature"
                        style={{ maxWidth: '100px', maxHeight: '50px' }}
                        preview={{
                            mask: 'View Signature',
                        }}
                        fallback="/placeholder-signature.png"
                    />
                ) : '-'
        },
    ];

    const handleStatusClick = (deal: PropertyDeal) => {
        setSelectedDeal(deal);
        setIsSignatureModalVisible(true);
    };

    const handleSignatureSubmit = async () => {
        if (!selectedDeal || !signatureRef.current || !confirmChecked) return;

        try {
            const signatureDataUrl = signatureRef.current.toDataURL();

            await dealsAPI.update(selectedDeal.dealId, {
                ...selectedDeal,
                status: 'verified',
                signature: signatureDataUrl,
            });

            message.success('Signature verified successfully');
            setIsSignatureModalVisible(false);
            setConfirmChecked(false);
            signatureRef.current.clear();
            fetchDeals();
        } catch (error) {
            console.error('Error updating signature:', error);
            message.error('Failed to verify signature');
        }
    };

    const handleNewTransaction = async (values: any) => {
        try {
            const newDeal = {
                dealAmount: Number(values.dealAmount),
                dealType: values.dealType,
                name: values.name,
                phone: Number(values.phone) || "",
                projectName: values.projectName,
                signature: "",
                status: "unverified",
                transactionAmount: Number(values.transactionAmount),
                transactionDate: new Date().toISOString().split('T')[0]
            };

            await dealsAPI.create(newDeal);
            message.success('New transaction added successfully');
            setIsNewTransactionModalVisible(false);
            newTransactionForm.resetFields();
            setUploadedImage('');
            fetchDeals();
        } catch (error) {
            console.error('Error adding new transaction:', error);
            message.error('Failed to add new transaction');
        }
    };

    const handleEditClick = () => {
        editForm.resetFields();
        setIsEditModalVisible(true);
    };

    const handleCustomerSelectInEdit = (customerName: string) => {
        const customerDeal = deals.find(deal => deal.name === customerName);
        if (customerDeal) {
            editForm.setFieldsValue({
                name: customerDeal.name,
                projectName: customerDeal.projectName,
                dealType: customerDeal.dealType,
                dealAmount: customerDeal.dealAmount
            });
            setSelectedDeal(customerDeal);
        }
    };

    const handleEditSubmit = async (values: any) => {
        try {
            if (!selectedDeal) return;
            setLoading(true);

            // Find all deals with the same customer name
            const dealsToUpdate = deals.filter(deal => deal.name === values.name);

            // Update each deal with new values except transactionAmount
            const updatePromises = dealsToUpdate.map(deal => {
                const updatedDeal = {
                    ...deal,
                    projectName: values.projectName,
                    dealType: values.dealType,
                    dealAmount: Number(values.dealAmount),
                    // Keep the original transactionAmount
                    transactionAmount: deal.transactionAmount,
                    transactionDate: new Date().toISOString(),
                };
                return dealsAPI.update(deal.dealId, updatedDeal);
            });

            await Promise.all(updatePromises);
            message.success('All deals for this customer updated successfully');
            setIsEditModalVisible(false);
            editForm.resetFields();
            setSelectedDeal(null);
            fetchDeals();
        } catch (error) {
            console.error('Error updating deals:', error);
            message.error('Failed to update deals');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            if (!selectedDeal) return;
            setLoading(true);

            // Find all deals with the same customer name
            const dealsToDelete = deals.filter(deal => deal.name === selectedDeal.name);

            // Delete all deals for the selected customer
            const deletePromises = dealsToDelete.map(deal =>
                dealsAPI.delete(deal.dealId)
            );

            await Promise.all(deletePromises);
            message.success('All deals for this customer deleted successfully');
            setIsDeleteModalVisible(false);
            setSelectedDeal(null);
            fetchDeals();
        } catch (error) {
            console.error('Error deleting deals:', error);
            message.error('Failed to delete deals');
        } finally {
            setLoading(false);
        }
    };

    const handleCustomerSelect = (customerName: string) => {
        const selectedCustomerDeal = deals.find(deal => deal.name === customerName);
        if (selectedCustomerDeal) {
            // Only set specific fields, ensuring status isn't copied
            newTransactionForm.setFieldsValue({
                name: selectedCustomerDeal.name,
                projectName: selectedCustomerDeal.projectName,
                dealType: selectedCustomerDeal.dealType,
                dealAmount: selectedCustomerDeal.dealAmount,
                phone: selectedCustomerDeal.phone
            });
        }
    };

    const handleImageUpload = async (file: File) => {
        try {
            const reader = new FileReader();
            reader.onload = () => {
                setUploadedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
            return false; // Prevent automatic upload
        } catch (error) {
            console.error('Error uploading image:', error);
            message.error('Failed to upload image');
            return false;
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
                            onClick={() => handleEditClick}
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
                    <p>Project: <strong>{deal.projectName}</strong></p>
                    <p>Type: <strong>{deal.dealType}</strong></p>
                    <p>Amount: <strong>₹{deal.transactionAmount.toLocaleString()}</strong></p>
                    <p>Total Deal: <strong>₹{deal.dealAmount.toLocaleString()}</strong></p>
                    <p>Status: <strong>
                        {(deal.status || 'unverified') === 'unverified' ? (
                            <Button
                                type="link"
                                onClick={() => handleStatusClick(deal)}
                                style={{ padding: 0 }}
                            >
                                Unverified
                            </Button>
                        ) : (
                            <span style={{ color: '#52c41a' }}>Verified</span>
                        )}
                    </strong></p>
                    {deal.signature && (
                        <p>Signature: <img
                            src={deal.signature}
                            alt="Signature"
                            style={{ maxWidth: '100px', maxHeight: '50px' }}
                        /></p>
                    )}
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
                                icon={<PlusOutlined />}
                                type="primary"
                                onClick={() => setIsNewTransactionModalVisible(true)}
                            >
                                New Transaction
                            </Button>
                            <Button
                                icon={<EditOutlined />}
                                onClick={handleEditClick}
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
                        loading={loading}
                        className="deals-table"
                    />
                </>
            ) : (
                <div style={{ position: 'relative', minHeight: '200px' }}>
                    <Button
                        icon={<PlusOutlined />}
                        type="primary"
                        onClick={() => setIsNewTransactionModalVisible(true)}
                        style={{ marginBottom: '16px', width: '100%' }}
                    >
                        New Transaction
                    </Button>
                    <Spin spinning={loading}>
                        <Row gutter={[16, 16]} className="mobile-cards">
                            {deals.map(renderMobileCard)}
                        </Row>
                    </Spin>
                </div>
            )}

            {/* New Transaction Modal */}
            <Modal
                title="New Transaction"
                open={isNewTransactionModalVisible}
                onCancel={() => {
                    setIsNewTransactionModalVisible(false);
                    newTransactionForm.resetFields();
                    setUploadedImage('');
                }}
                footer={null}
            >
                <Form
                    form={newTransactionForm}
                    onFinish={handleNewTransaction}
                    layout="vertical"
                >
                    <Form.Item
                        name="name"
                        label="Customer Name"
                        rules={[{ required: true, message: 'Please enter customer name' }]}
                    >
                        <Select onChange={handleCustomerSelect}>
                            {customers.map(customer => (
                                <Select.Option key={customer} value={customer}>
                                    {customer}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="phone"
                        label="Phone Number"
                        rules={[{ required: true, message: 'Please enter phone number' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="projectName"
                        label="Project Name"
                        rules={[{ required: true, message: 'Please enter project name' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="dealType"
                        label="Transaction Type"
                        rules={[{ required: true, message: 'Please select transaction type' }]}
                    >
                        <Radio.Group>
                            <Radio value="buy">Buy</Radio>
                            <Radio value="sell">Sell</Radio>
                        </Radio.Group>
                    </Form.Item>

                    <Form.Item
                        name="transactionAmount"
                        label="Transaction Amount"
                        rules={[{ required: true, message: 'Please enter transaction amount' }]}
                    >
                        <Input type="number" />
                    </Form.Item>

                    <Form.Item
                        name="dealAmount"
                        label="Total Deal Amount"
                        rules={[{ required: true, message: 'Please enter total deal amount' }]}
                    >
                        <Input type="number" />
                    </Form.Item>

                    <Form.Item
                        name="paymentReceipt"
                        label="Payment Receipt"
                    >
                        <Upload
                            beforeUpload={handleImageUpload}
                            accept="image/*"
                            maxCount={1}
                            showUploadList={true}
                        >
                            <Button icon={<UploadOutlined />}>Upload Receipt</Button>
                        </Upload>
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit">
                            Submit Transaction
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Signature Modal */}
            <Modal
                title="Verify Transaction"
                open={isSignatureModalVisible}
                onCancel={() => {
                    setIsSignatureModalVisible(false);
                    setConfirmChecked(false);
                    if (signatureRef.current) {
                        signatureRef.current.clear();
                    }
                }}
                footer={[
                    <Button
                        key="cancel"
                        onClick={() => {
                            setIsSignatureModalVisible(false);
                            setConfirmChecked(false);
                            if (signatureRef.current) {
                                signatureRef.current.clear();
                            }
                        }}
                    >
                        Cancel
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        onClick={handleSignatureSubmit}
                        disabled={!confirmChecked}
                    >
                        Verify
                    </Button>
                ]}
            >
                <div className="signature-section">
                    <h4>Please draw your signature below:</h4>
                    <div className="signature-container">
                        <SignatureCanvas
                            ref={signatureRef}
                            canvasProps={{
                                width: 500,
                                height: 200,
                                className: 'signature-canvas',
                            }}
                        />
                    </div>

                </div>
                <Button
                    size="small"
                    onClick={() => signatureRef.current?.clear()}
                    style={{ marginTop: '8px', marginBottom: '8px' }}
                >
                    Clear
                </Button>
                <Checkbox
                    checked={confirmChecked}
                    onChange={(e) => setConfirmChecked(e.target.checked)}
                >
                    I hereby confirm that the amount of ₹{selectedDeal?.transactionAmount.toLocaleString()} has been received and I acknowledge receipt of the payment.
                </Checkbox>
            </Modal>

            {/* Edit Modal */}
            <Modal
                title="Edit Deals"
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
                        rules={[{ required: true, message: 'Please select a customer' }]}
                    >
                        <Select
                            placeholder="Select a customer"
                            onChange={handleCustomerSelectInEdit}
                        >
                            {customers.map(customer => (
                                <Select.Option key={customer} value={customer}>
                                    {customer}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    {selectedDeal && (
                        <>
                            <Form.Item
                                name="projectName"
                                label="Project Name"
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
                                name="dealAmount"
                                label="Total Deal Amount"
                                rules={[{ required: true }]}
                            >
                                <Input type="number" />
                            </Form.Item>

                            <Form.Item>
                                <Button type="primary" htmlType="submit">
                                    Update All Deals
                                </Button>
                            </Form.Item>
                        </>
                    )}
                </Form>
            </Modal>

            {/* Delete Modal */}
            <Modal
                title="Delete Deals"
                open={isDeleteModalVisible}
                onCancel={() => {
                    setIsDeleteModalVisible(false);
                    setSelectedDeal(null);
                }}
                footer={null}
            >
                <Form layout="vertical">
                    <Form.Item
                        name="customerName"
                        label="Select Customer"
                        rules={[{ required: true, message: 'Please select a customer!' }]}
                    >
                        <Select
                            placeholder="Select a customer"
                            onChange={(value) => {
                                const deal = deals.find(d => d.name === value);
                                setSelectedDeal(deal || null);
                            }}
                            value={selectedDeal?.name}
                        >
                            {customers.map((customer) => (
                                <Select.Option key={customer} value={customer}>
                                    {customer}
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
                                        <p>Are you sure you want to delete the deal for customer: <strong>{selectedDeal.name}</strong>?</p>
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