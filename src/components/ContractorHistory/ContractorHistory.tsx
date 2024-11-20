import React from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { Steps, Card, Typography, Row, Col, Button } from 'antd';
import { CloseOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

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

const ContractorHistory = () => {
    const { state: contractor } = useLocation();
    const { contractorId } = useParams();
    const navigate = useNavigate();

    const sortedTransactions = [...(contractor.transactions || [])].sort((a, b) =>
        new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
    );

    const totalAmount = sortedTransactions.reduce((acc, transaction) =>
        acc + transaction.transactionAmount, 0
    );

    const handleClose = () => {
        navigate('/contractors');
    };

    return (
        <Card
            className="contractor-history-card"
            title={
                <div className="history-header">
                    <Title level={4}>{contractor.name} - History</Title>
                    <Button icon={<CloseOutlined />} type="text" onClick={handleClose} >
                        Close
                    </Button>
                </div>
            }
        >
            <Row>
                <Col span={24}>
                    <Steps
                        direction="vertical"
                        progressDot
                        current={sortedTransactions.length - 1}
                        items={sortedTransactions.map((transaction, index) => ({
                            title: (
                                <div className="step-title">
                                    <Text type="secondary">
                                        {new Date(transaction.transactionDate).toLocaleDateString()}
                                    </Text>
                                </div>
                            ),
                            description: (
                                <div className="step-description">
                                    <Text>Amount: {transaction.transactionAmount.toLocaleString()}</Text>
                                </div>
                            ),
                            className: index === 0 ? 'latest-step' : ''
                        }))}
                    />
                </Col>
            </Row>
            <Row>
                <Col span={24} style={{ marginTop: '16px' }}>
                    <Text strong>Total Amount: {totalAmount.toLocaleString()}</Text>
                </Col>
            </Row>
        </Card>
    );
};

export default ContractorHistory;