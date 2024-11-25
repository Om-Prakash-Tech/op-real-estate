import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Steps, Card, Typography, Row, Col, Button } from 'antd';
import { CloseOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

interface PropertyDeal {
    dealId: string;
    name: string;
    phone: number;
    projectName: string;
    address: string;
    dealType: 'buy' | 'sell';
    transactionAmount: number;
    dealAmount: number;
    transactionDate: string;
}

const DealsHistory = () => {
    const { state: customerDeals } = useLocation();
    const navigate = useNavigate();

    // Sort transactions by date in descending order
    const sortedTransactions = [...customerDeals].sort((a, b) =>
        new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
    );

    // Calculate total amount
    const totalAmount = sortedTransactions.reduce((acc, deal) =>
        acc + deal.transactionAmount, 0
    );

    const handleClose = () => {
        navigate('/projects');
    };

    return (
        <>
            <Button icon={<CloseOutlined />} type="text" onClick={handleClose}>
                Close
            </Button>
            <Card
                className="project-history-card"
                title={
                    <div style={{ wordWrap: 'break-word', whiteSpace: 'normal', fontSize: '1.3rem', paddingTop: '5px' }}>
                        {sortedTransactions[0]?.name} - Transaction History
                    </div>
                }
            >
                <Row>
                    <Col span={24}>
                        <Steps
                            direction="vertical"
                            progressDot
                            current={sortedTransactions.length - 1}
                            items={sortedTransactions.map((deal, index) => ({
                                title: (
                                    <div className="step-title">
                                        <Text type="secondary">
                                            {new Date(deal.transactionDate).toLocaleDateString()}
                                        </Text>
                                    </div>
                                ),
                                description: (
                                    <div className="step-description">
                                        <Text>Amount: {deal.transactionAmount.toLocaleString()}</Text>
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
        </>
    );
};

export default DealsHistory;
