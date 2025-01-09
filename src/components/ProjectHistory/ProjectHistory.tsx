import React, { useEffect, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { Steps, Card, Typography, Row, Col, Button } from 'antd';
import jsPDF, { Font } from 'jspdf';
import autoTable from 'jspdf-autotable';
import './project-history.css';
import { CloseOutlined, DownloadOutlined } from '@ant-design/icons';
import { metricsAPI, projectsAPI } from '../../api';

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

const ProjectHistory = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState<ProjectWithDetails | null>(null);
    const [contractorDetailsMap, setContractorDetailsMap] = useState<{ [key: string]: Contractor }>({});

    useEffect(() => {
        const fetchProjectData = async () => {
            try {
                const projectResponse = await projectsAPI.getById(projectId || '');
                const projectData = projectResponse.data;

                const transactionsResponse = await metricsAPI.getProjectTransactions(projectId || '');
                const transactions = transactionsResponse.data;

                const contractorsResponse = await metricsAPI.getProjectContractors(projectId || '');
                const contractors = contractorsResponse.data;

                const contractorsMap = contractors.reduce((acc: { [key: string]: Contractor }, contractor: Contractor) => {
                    acc[contractor.contractorId] = contractor;
                    return acc;
                }, {});

                setProject({
                    ...projectData,
                    transactions: transactions,
                    contractorDetails: contractors
                });
                setContractorDetailsMap(contractorsMap);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchProjectData();
    }, [projectId]);

    if (!project) return <div>Loading...</div>;

    const sortedTransactions = [...project.transactions].sort((a, b) =>
        new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
    );

    const totalAmount = sortedTransactions.reduce((acc, transaction) =>
        acc + transaction.transactionAmount, 0
    );

    const getContractorName = (contractorData: string | any) => {
        const contractorId = typeof contractorData === 'string'
            ? contractorData
            : contractorData.contractorId;

        const contractor = contractorDetailsMap[contractorId];
        return contractor?.name || contractorData?.name || 'Unknown Contractor';
    };

    const handleClose = () => {
        navigate('/projects');
    };

    const generatePDF = () => {
        const doc = new jsPDF();
        doc.setFont("helvetica", "normal");

        doc.setFontSize(16);
        doc.text(`Transaction Report - ${project.name}`, 14, 20);

        const tableData = sortedTransactions.map(transaction => {
            // Handle case where transaction.contractor is either an ID or a full object
            const contractorData = typeof transaction.contractor === 'string'
                ? contractorDetailsMap[transaction.contractor]
                : transaction.contractor;

            return [
                new Date(transaction.transactionDate).toLocaleDateString(),
                contractorData?.name || 'Unknown',
                contractorData?.phone?.toString() || 'N/A',
                contractorData?.email || 'N/A',
                transaction.transactionAmount.toLocaleString()
            ];
        });

        // Add total row with rupee symbol
        tableData.push([
            'Total',
            '',
            '',
            '',
            totalAmount.toLocaleString()
        ]);

        // Use autoTable with specified font
        autoTable(doc, {
            head: [['Date', 'Contractor Name', 'Phone', 'Email', 'Amount']],
            body: tableData,
            startY: 30,
            styles: {
                fontSize: 10,
                font: "helvetica"
            },
            headStyles: { fillColor: [66, 139, 202] },
            footStyles: { fillColor: [240, 240, 240] }
        });

        doc.save(`${project.name}-transactions.pdf`);
    };

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <Button icon={<CloseOutlined />} type="text" onClick={handleClose}>
                    Close
                </Button>
                <Button
                    icon={<DownloadOutlined />}
                    type="primary"
                    onClick={generatePDF}
                >
                    Download Report
                </Button>
            </div>
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
                                        <Text strong>{getContractorName(transaction.contractor)}</Text>
                                        <Text type="secondary">
                                            {new Date(transaction.transactionDate).toLocaleDateString()}
                                        </Text>
                                    </div>
                                ),
                                description: (
                                    <div className="step-description">
                                        <Text>Amount: ₹{transaction.transactionAmount.toLocaleString()}</Text>
                                    </div>
                                ),
                                className: index === 0 ? 'latest-step' : ''
                            }))}
                        />
                    </Col>
                </Row>
                <Row>
                    <Col span={24} style={{ marginTop: '16px' }}>
                        <Text strong>Total Amount: ₹{totalAmount.toLocaleString()}</Text>
                    </Col>
                </Row>
            </Card>
        </>
    );
};

export default ProjectHistory;