import React from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { Steps, Card, Typography, Row, Col, Button } from 'antd';
import './project-history.css';
import { CloseOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;


interface Contractor {
    contractorId: string;
    name: string;
    email: string;
    phone: number;
    createdAt: string;
    updatedAt: string;
}

interface Project {
    projectId: string;
    name: string;
    address: string;
    contractors: string[];
    dueDate: string;
    budget: number;
    createdAt: string;
    updatedAt: string;
}

interface Transaction {
    project: string;
    contractor: string;
    transactionAmount: number;
    transactionDate: string;
    transactionProof: string;
    signature: string;
}

interface ProjectWithDetails extends Project {
    contractorDetails: Contractor[];
    transactions: Transaction[];
}

interface ProjectHistoryProps {
    project: ProjectWithDetails;
    onClose: () => void;
    isMobile: boolean;
}

const ProjectHistory = () => {
    const { state: project } = useLocation();
    const { projectId } = useParams();
    const navigate = useNavigate();

    const sortedTransactions = [...project.transactions].sort((a, b) =>
        new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
    );

    const totalAmount = sortedTransactions.reduce((acc, transaction) =>
        acc + transaction.transactionAmount, 0
    );

    const getContractorName = (contractorId: string) => {
        const contractor = project.contractorDetails.find((c: { contractorId: string; }) => c.contractorId === contractorId);
        return contractor?.name || 'Unknown Contractor';
    };

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
                        {project.name} - Transaction History
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
                                        {/*<Text strong>{getContractorName(transaction.contractor)}</Text>*/}
                                        <Text type="secondary">
                                            {new Date(transaction.transactionDate).toLocaleDateString()}
                                        </Text>
                                    </div>
                                ),
                                description: (
                                    <div className="step-description">
                                        <Text>Amount: {transaction.transactionAmount.toLocaleString()}</Text>
                                        {/*{transaction.transactionProof && (
                                        <Text className="proof">Proof: {transaction.transactionProof}</Text>
                                    )}*/}
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

export default ProjectHistory;
