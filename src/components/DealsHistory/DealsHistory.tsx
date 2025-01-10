import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Steps, Card, Typography, Row, Col, Button } from 'antd';
import { CloseOutlined, DownloadOutlined } from '@ant-design/icons';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

    const generatePDF = () => {
        const doc = new jsPDF();

        // Add title
        const projectName = sortedTransactions[0]?.projectName || 'Project';
        doc.setFontSize(16);
        doc.text(`Transaction Report - ${projectName}`, 14, 20);

        // Prepare table data
        const tableData = sortedTransactions.map(deal => [
            new Date(deal.transactionDate).toLocaleDateString(),
            deal.name,
            deal.phone.toString(),
            deal.transactionAmount.toLocaleString()
        ]);

        // Add total row
        tableData.push([
            'Total',
            '',
            '',
            totalAmount.toLocaleString()
        ]);

        // Calculate balance
        const dealAmount = sortedTransactions[0]?.dealAmount || 0;
        const balance = dealAmount - totalAmount;

        tableData.push([
            'Total Deal Amount',
            '',
            '',
            dealAmount.toLocaleString()
        ]);

        // Add balance row
        tableData.push([
            'Balance',
            '',
            '',
            balance.toLocaleString()
        ]);

        // Configure and generate table
        autoTable(doc,{
            startY: 35,
            head: [['Date', 'Name', 'Phone', 'Amount']],
            body: tableData,
            theme: 'grid',
            styles: {
                fontSize: 10,
                font: "helvetica"
            },
            headStyles: { fillColor: [66, 139, 202] },
            footStyles: { fillColor: [240, 240, 240] }
        });

        // Save the PDF
        doc.save(`${projectName}_transaction_report.pdf`);
    };

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
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