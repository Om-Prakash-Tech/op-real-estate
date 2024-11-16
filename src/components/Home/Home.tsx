import React, { useState, useEffect } from 'react'
import { Table, Modal, Checkbox, Button, message, Card, Row, Col, Image } from 'antd';
import { ColumnType } from 'antd/es/table';
import { TransactionOutlined } from '@ant-design/icons';
import SignatureCanvas from 'react-signature-canvas';
import { transactionsAPI } from '../../api';
import './Home.css';
import NewTransaction from '../NewTransaction/NewTransaction';


interface Transaction {
  transactionId: string;
  project: {
    projectId: string;
    projectName: string;
  };
  contractor: {
    contractorId: string;
    name: string;
    email: string;
    phone: number;
  };
  transactionAmount: number;
  transactionDate: string;
  transactionProof: string;
  signature: string;
  status: 'verified' | 'unverified';
}

interface HomeProps {
  refreshKey?: number;
}

const Home: React.FC<HomeProps> = ({ refreshKey = 0 }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [modalVisible, setModalVisible] = useState(false)
  const [showNewTransactionModal, setShowNewTransactionModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [signatureRef, setSignatureRef] = useState<SignatureCanvas | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const transactionsResponse = await transactionsAPI.getAll();
      setTransactions(transactionsResponse.data);
    } catch (error) {
      message.error('Failed to fetch data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshKey]);

  const handleActionClick = (record: Transaction) => {
    if (record.status === 'verified') return;

    setSelectedTransaction(record);
    setModalVisible(true);
    setIsConfirmed(false);
    signatureRef?.clear();
  };

  const handleModalSubmit = async () => {
    if (!isConfirmed || !selectedTransaction) return;

    try {
      const signatureData = signatureRef?.toDataURL();

      await transactionsAPI.update(selectedTransaction.transactionId, {
        project: selectedTransaction.project.projectId,
        contractor: selectedTransaction.contractor.contractorId,
        transactionAmount: selectedTransaction.transactionAmount,
        transactionDate: selectedTransaction.transactionDate,
        transactionProof: selectedTransaction.transactionProof,
        signature: signatureData
      });

      message.success('Transaction verified successfully');
      fetchData();
      setModalVisible(false);
      setIsConfirmed(false);
      signatureRef?.clear();
    } catch (error) {
      console.error('Error updating transaction verification:', error);
      message.error('Failed to verify transaction. Please try again.');
    }
  };

  const columns: ColumnType<Transaction>[] = [
    {
      title: 'Project Name',
      width: 150,
      dataIndex: ['project', 'projectName'],
      key: 'projectName',
      align: 'left',
    },
    {
      title: 'Contractor Name',
      width: 150,
      dataIndex: ['contractor', 'name'],
      key: 'contractorName',
      fixed: 'left',
    },
    {
      title: 'Phone',
      width: 120,
      dataIndex: ['contractor', 'phone'],
      key: 'contractorPhone',
      align: 'center',
    },
    {
      title: 'Email',
      width: 200,
      dataIndex: ['contractor', 'email'],
      key: 'contractorEmail',
      align: 'center',
    },
    {
      title: 'Transaction Amount',
      width: 150,
      dataIndex: 'transactionAmount',
      key: 'transactionAmount',
      align: 'center',
      render: (value: number) => `₹${value.toLocaleString()}`
    },
    {
      title: 'Signature Status',
      key: 'signature',
      width: 120,
      render: (_, record: Transaction) => {
        return (
          <a
            onClick={() => handleActionClick(record)}
            style={{
              color: record.status === 'unverified' ? '#1890ff' : '#52c41a',
              cursor: record.status === 'unverified' ? 'pointer' : 'default',
            }}
          >
            {record.status}
          </a>
        );
      },
      align: 'center',
    },
  ];

  const renderMobileCards = () => {
    return (
      <Row gutter={[16, 16]} className="mobile-cards">
        {transactions.map((transaction) => (
          <Col xs={24} key={transaction.transactionId}>
            <Card
              className={`transaction-card ${selectedTransaction?.transactionId === transaction.transactionId ? 'selected' : ''}`}
            >
              <div className='header'>
                <div className="cont-name">{transaction.contractor.name}</div>
                <Button
                  className='edit-button'
                  type="primary"
                  icon={<TransactionOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowNewTransactionModal(true);
                  }}
                />
              </div>
              <div className="divider" />
              <div className="amount-item">
                <span className="label">Project Name:</span>
                <span className="value">{transaction.project.projectName}</span>
              </div>
              <div className="contact-info">
                <div className="info-item">
                  <span className="label">Phone:</span>
                  <span className="value">{transaction.contractor.phone}</span>
                </div>
                <div className="info-item">
                  <span className="label">Email:</span>
                  <span className="value">{transaction.contractor.email}</span>
                </div>
              </div>
              <div className="amount-item">
                <span className="label">Transaction Amount:</span>
                <span className="value">₹{transaction.transactionAmount.toLocaleString()}</span>
              </div>

              <div className="divider" />
              <div
                className={`verification-status ${transaction.status === 'unverified' ? 'pending' : 'verified'}`}
                onClick={() => transaction.status === 'unverified' ? handleActionClick(transaction) : undefined}
                style={{
                  cursor: transaction.status === 'unverified' ? 'pointer' : 'default'
                }}
              >
                <span className="label">Signature Status:</span>
                {transaction.status}
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    );
  };

  return (
    <div className="home-container">
      <div className="new-transaction-button-container">
        <Button
          type="primary"
          icon={<TransactionOutlined />}
          onClick={() => setShowNewTransactionModal(true)}
        >
          New Transaction
        </Button>
      </div>

      <div className="table-container">
        {window.innerWidth <= 768 ? renderMobileCards() : (
          <>
            <Table
              loading={loading}
              pagination={false}
              columns={columns}
              dataSource={transactions}
              scroll={{
                x: 'max-content',
                y: 'calc(100vh - 230px)',
              }}
            />
          </>
        )}
      </div>

      <Modal
        title="Verification Confirmation"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleModalSubmit}
            disabled={!isConfirmed || signatureRef?.isEmpty()}
          >
            Submit
          </Button>,
        ]}
      >
        <div className="verification-modal">
          <Checkbox
            checked={isConfirmed}
            onChange={(e) => setIsConfirmed(e.target.checked)}
          >
            I hereby confirm that the amount of ₹
            {selectedTransaction?.transactionAmount.toLocaleString()} has
            been received and I acknowledge receipt of the payment.
          </Checkbox>

          <div className="signature-section">
            <h4>Please draw your signature below:</h4>
            <div className="signature-container">
              <SignatureCanvas
                ref={(ref) => setSignatureRef(ref)}
                canvasProps={{
                  className: 'signature-canvas',
                  width: 500,
                  height: 200,
                }}
              />
            </div>
          </div>
        </div>
        <Button size="small" onClick={() => signatureRef?.clear()}>
          Clear Signature
        </Button>
      </Modal>

      {showNewTransactionModal && (
        <Modal
          title="New Transaction"
          open={showNewTransactionModal}
          onCancel={() => setShowNewTransactionModal(false)}
          footer={null}
          className="transaction-modal"
          style={{ top: '7vh' }}
        >
          <NewTransaction
            onTransactionSuccess={() => {
              setShowNewTransactionModal(false);
              fetchData(); // Refresh data after successful transaction
            }}
          />
        </Modal>
      )}
    </div>
  );
};

export default Home;