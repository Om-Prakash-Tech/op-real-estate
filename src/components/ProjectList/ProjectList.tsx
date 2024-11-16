import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Modal, Form, Input, DatePicker, Select, message, Card, Row, Col, Space, Radio, Alert } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import moment from 'moment';
import {
    contractorsAPI,
    projectsAPI,
    dealsAPI,
    metricsAPI,
    //transactionsAPI
} from '../../api';
//import ProjectHistory from '../ProjectHistory/ProjectHistory';
import './project-list.css';
import { ColumnType } from 'antd/es/table';

// Updated interfaces with proper types
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

interface ProjectWithDetails extends Project {
    contractorDetails: Contractor[];
    transactions: Transaction[];
}


const ProjectList = () => {
    const [projects, setProjects] = useState<ProjectWithDetails[]>([]);
    const [propertyDeals, setPropertyDeals] = useState<PropertyDeal[]>([]);
    const [contractors, setContractors] = useState<Contractor[]>([]);
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [selectedProject, setSelectedProject] = useState<ProjectWithDetails | PropertyDeal | null>(null);
    const [selectedEditProject, setSelectedEditProject] = useState<string>('');
    const [selectedDeleteProject, setSelectedDeleteProject] = useState<string>('');
    const [selectedProjectHistory, setSelectedProjectHistory] = useState<ProjectWithDetails | null>(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [projectType, setProjectType] = useState<'contractor' | 'property'>('contractor');
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();
    const [editForm] = Form.useForm();
    const navigate = useNavigate();

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchProjectDetails = async (project: Project): Promise<ProjectWithDetails> => {
        try {
            const [contractorsResponse, transactionsResponse] = await Promise.all([
                metricsAPI.getProjectContractors(project.projectId),
                metricsAPI.getProjectTransactions(project.projectId)
            ]);

            return {
                ...project,
                contractorDetails: contractorsResponse.data || [],
                transactions: transactionsResponse.data || []
            };
        } catch (error) {
            console.error('Error fetching project details:', error);
            return {
                ...project,
                contractorDetails: [],
                transactions: []
            };
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch all data with proper error handling
            const [projectsRes, dealsRes, contractorsRes] = await Promise.all([
                projectsAPI.getAll(),
                dealsAPI.getAll(),
                contractorsAPI.getAll()
            ]);

            // Type check and validate responses
            if (!projectsRes.data || !Array.isArray(projectsRes.data)) {
                throw new Error('Invalid projects data format');
            }

            if (!dealsRes.data || !Array.isArray(dealsRes.data)) {
                throw new Error('Invalid deals data format');
            }

            if (!contractorsRes.data || !Array.isArray(contractorsRes.data)) {
                throw new Error('Invalid contractors data format');
            }

            // Fetch details for each project
            const projectsWithDetails = await Promise.all(
                projectsRes.data.map(fetchProjectDetails)
            );

            setProjects(projectsWithDetails);
            setPropertyDeals(dealsRes.data);
            setContractors(contractorsRes.data);

        } catch (error) {
            console.error('Error fetching data:', error);
            message.error('Failed to fetch data. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddProject = async (values: any) => {
        try {
            if (values.projectType === 'contractor') {
                const projectData = {
                    name: values.name,
                    address: values.address,
                    contractors: values.contractors.map((name: string) =>
                        contractors.find(c => c.name === name)?.contractorId
                    ).filter(Boolean),
                    dueDate: values.dueDate.format('YYYY-MM-DD'),
                    budget: Number(values.budget),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                await projectsAPI.create(projectData);
            } else {
                const dealData = {
                    projectName: values.projectName,
                    address: values.address,
                    name: values.name,
                    phone: values.phone,
                    dealType: values.dealType.toLowerCase(),
                    transactionAmount: Number(values.transactionAmount),
                    dealAmount: Number(values.dealAmount),
                    transactionDate: moment().format('DD-MM-YYYY')
                };
                await dealsAPI.create(dealData);
            }

            setIsAddModalVisible(false);
            message.success('Project added successfully');
            form.resetFields();
            await fetchData(); // Refresh data after adding
        } catch (error) {
            console.error('Error adding project:', error);
            message.error('Failed to add project. Please try again.');
        }
    };

    const handleEditProject = async (values: any) => {
        try {
            if (!selectedProject) return;

            if ('projectId' in selectedProject) {
                const projectData = {
                    name: values.name,
                    address: values.address,
                    contractors: values.contractors,
                    dueDate: values.dueDate.format('YYYY-MM-DD'),
                    budget: Number(values.budget),
                    updatedAt: new Date().toISOString()
                };
                await projectsAPI.update(selectedProject.projectId, projectData);
            } else {
                const dealData = {
                    projectName: values.projectName,
                    address: values.address,
                    name: values.name,
                    phone: values.phone,
                    dealType: values.dealType.toLowerCase(),
                    transactionAmount: Number(values.transactionAmount),
                    dealAmount: Number(values.dealAmount)
                };
                await dealsAPI.update(selectedProject.dealId, dealData);
            }

            setIsEditModalVisible(false);
            message.success('Project updated successfully');
            editForm.resetFields();
            setSelectedProject(null);
            await fetchData(); // Refresh data after editing
        } catch (error) {
            console.error('Error updating project:', error);
            message.error('Failed to update project. Please try again.');
        }
    };

    const handleDeleteProject = async () => {
        try {
            if (!selectedProject) return;

            if ('projectId' in selectedProject) {
                await projectsAPI.delete(selectedProject.projectId);
            } else {
                await dealsAPI.delete(selectedProject.dealId);
            }

            setIsDeleteModalVisible(false);
            message.success('Project deleted successfully');
            setSelectedProject(null);
            await fetchData(); // Refresh data after deleting
        } catch (error) {
            console.error('Error deleting project:', error);
            message.error('Failed to delete project. Please try again.');
        }
    };


    const handleProjectClick = (project: ProjectWithDetails) => {
        navigate(`/project-history/${project.projectId}`, { state: project });
        setSelectedProjectHistory(project);
        
    };

    const handleEditProjectSelect = (value: string) => {
        setSelectedEditProject(value);
        const project = [...projects, ...propertyDeals].find(p =>
            'projectId' in p ? p.projectId === value : p.dealId === value
        );

        if (project) {
            if ('projectId' in project) {
                editForm.setFieldsValue({
                    projectType: 'contractor',
                    name: project.name,
                    address: project.address,
                    contractors: project.contractors,
                    dueDate: moment(project.dueDate),
                    budget: project.budget
                });
            } else {
                editForm.setFieldsValue({
                    projectType: 'property',
                    projectName: project.projectName,
                    address: project.address,
                    name: project.name,
                    phone: project.phone,
                    dealType: project.dealType.charAt(0).toUpperCase() + project.dealType.slice(1),
                    transactionAmount: project.transactionAmount,
                    dealAmount: project.dealAmount
                });
            }
        }
    };

    const contractorColumns: ColumnType<ProjectWithDetails>[] = [
        {
            title: 'Project Name',
            dataIndex: 'name',
            key: 'name',
            width: 200,
        },
        {
            title: 'Address',
            dataIndex: 'address',
            key: 'address',
            width: 200,
            render: (address) => address ? `${address.toLocaleString()}` : 'N/A',

        },
        {
            title: 'Contractors',
            dataIndex: 'contractorDetails',
            key: 'contractors',
            width: 200,
            render: (contractors: Contractor[]) =>
                contractors.map(c => c.name).join(', ') || 'No contractors assigned',
        },
        {
            title: 'Due Date',
            dataIndex: 'dueDate',
            key: 'dueDate',
            width: 150,
            render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A',
        },
        {
            title: 'Budget',
            dataIndex: 'budget',
            key: 'budget',
            width: 150,
            render: (budget) => budget ? `${budget.toLocaleString()}` : 'N/A',
        },
        /*{
            title: 'Last Updated',
            dataIndex: 'updatedAt',
            key: 'updatedAt',
            width: 150,
            render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A',
        },*/
    ];

    const propertyColumns: ColumnType<PropertyDeal>[] = [
        {
            title: 'Project Name',
            dataIndex: 'projectName',
            key: 'projectName',
            width: 200,
        },
        {
            title: 'Customer Name',
            dataIndex: 'name',
            key: 'customerName',
            width: 200,
        },
        {
            title: 'Customer Number',
            dataIndex: 'phone',
            key: 'customerNumber',
            width: 150,
        },
        {
            title: 'Transaction Type',
            dataIndex: 'dealType',
            key: 'transactionType',
            width: 150,
        },
        {
            title: 'Transaction Amount',
            dataIndex: 'transactionAmount',
            key: 'transactionAmount',
            width: 150,
            render: (amount) => amount ? `${amount.toLocaleString()}` : 'N/A',
        },
        {
            title: 'Total Deal Amount',
            dataIndex: 'dealAmount',
            key: 'dealAmount',
            width: 150,
            render: (amount) => amount ? `${amount.toLocaleString()}` : 'N/A',
        },
    ];


    const renderProjectForm = (formInstance: any) => {
        const type = formInstance.getFieldValue('projectType') || projectType;

        return (
            <>
                <Form.Item
                    name="projectType"
                    label="Project Type"
                    rules={[{ required: true, message: 'Please select a project type!' }]}
                >
                    <Radio.Group onChange={(e) => setProjectType(e.target.value)}>
                        <Radio value="contractor">Contractor</Radio>
                        <Radio value="property">Buy/Sell</Radio>
                    </Radio.Group>
                </Form.Item>

                {type === 'contractor' ? (
                    <>
                        <Form.Item
                            name="name"
                            label="Project Name"
                            rules={[{ required: true, message: 'Please input the project name!' }]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item name="address" label="Address">
                            <Input />
                        </Form.Item>

                        <Form.Item
                            name="contractors"
                            label="Assign Contractors"
                            rules={[{ required: true, message: 'Please select at least one contractor!' }]}
                        >
                            <Select mode="multiple" placeholder="Select contractors">
                                {contractors.map((contractor) => (
                                    <Select.Option key={contractor.contractorId} value={contractor.contractorId}>
                                        {contractor.name}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="dueDate"
                            label="Due Date"
                            rules={[{ required: true, message: 'Please select a due date!' }]}
                        >
                            <DatePicker />
                        </Form.Item>

                        <Form.Item
                            name="budget"
                            label="Budget"
                            rules={[{ required: true, message: 'Please enter the budget!' }]}
                        >
                            <Input type="number" />
                        </Form.Item>
                    </>
                ) : (
                    // Property deal form fields remain unchanged
                    <>
                        <Form.Item
                            name="projectName"
                            label="Project Name"
                            rules={[{ required: true, message: 'Please enter project name!' }]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item name="address" label="Address">
                            <Input />
                        </Form.Item>

                        <Form.Item
                            name="name"
                            label="Customer Name"
                            rules={[{ required: true, message: 'Please enter customer name!' }]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            name="phone"
                            label="Customer Number"
                            rules={[{ required: true, message: 'Please enter customer number!' }]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            name="dealType"
                            label="Transaction Type"
                            rules={[{ required: true, message: 'Please select transaction type!' }]}
                        >
                            <Radio.Group>
                                <Radio value="Buy">Buy</Radio>
                                <Radio value="Sell">Sell</Radio>
                            </Radio.Group>
                        </Form.Item>

                        <Form.Item
                            name="transactionAmount"
                            label="Transaction Amount"
                            rules={[{ required: true, message: 'Please enter transaction amount!' }]}
                        >
                            <Input type="number" />
                        </Form.Item>

                        <Form.Item
                            name="dealAmount"
                            label="Total Deal Amount"
                            rules={[{ required: true, message: 'Please enter total deal amount!' }]}
                        >
                            <Input type="number" />
                        </Form.Item>
                    </>
                )}
            </>
        );
    };

    const renderMobileCards = (items: (ProjectWithDetails | PropertyDeal)[], type: 'contractor' | 'property') => {
        return (
            <Row gutter={[16, 16]} className="mobile-cards">
                {items.map((item) => (
                    <Col xs={24} key={'projectId' in item ? item.projectId : item.dealId}>
                        <Card
                            className="project-card"
                            onClick={() => {
                                if (type === 'contractor') {
                                    handleProjectClick(item as ProjectWithDetails);
                                }
                            }}
                            style={{ cursor: type === 'contractor' ? 'pointer' : 'default' }}
                            actions={[

                            ]}
                        >
                            {type === 'contractor' ? (
                                <>
                                    <div className='card-header'>
                                        <h3 className="project-name">{(item as ProjectWithDetails).name}</h3>

                                        <div className='mobile-buttons'>
                                            <Button
                                                key="edit"
                                                icon={<EditOutlined />}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedProject(item);
                                                    setIsEditModalVisible(true);
                                                    editForm.setFieldsValue(
                                                        {
                                                            projectType: 'contractor',
                                                            name: (item as ProjectWithDetails).name,
                                                            address: (item as ProjectWithDetails).address,
                                                            contractors: (item as ProjectWithDetails).contractors,
                                                            dueDate: moment((item as ProjectWithDetails).dueDate),
                                                            budget: (item as ProjectWithDetails).budget
                                                        }

                                                    );
                                                }}
                                            />

                                            <Button
                                                key="delete"
                                                icon={<DeleteOutlined />}
                                                danger
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedProject(item);
                                                    setIsDeleteModalVisible(true);
                                                }}
                                            />
                                        </div>
                                    </div>


                                    <div className="project-details">
                                        <div className="detail-item">
                                            <span className="label">Address:</span>
                                            <span className="value">{(item as ProjectWithDetails).address}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="label">Contractors:</span>
                                            <span className="value">
                                                {(item as ProjectWithDetails).contractorDetails.map(c => c.name).join(', ') || 'None assigned'}
                                            </span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="label">Due Date:</span>
                                            <span className="value">
                                                {(item as ProjectWithDetails).dueDate ? new Date((item as ProjectWithDetails).dueDate).toLocaleDateString() : 'N/A'}
                                            </span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="label">Budget:</span>
                                            <span className="value">₹{(item as ProjectWithDetails).budget?.toLocaleString()}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="label">Last Updated:</span>
                                            <span className="value">
                                                {(item as ProjectWithDetails).updatedAt ? new Date((item as ProjectWithDetails).updatedAt).toLocaleDateString() : 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className='card-header'>

                                        <h3 className="project-name">{(item as PropertyDeal).projectName}</h3>
                                        <div className='mobile-buttons'>
                                            <Button
                                                key="edit"
                                                icon={<EditOutlined />}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedProject(item);
                                                    setIsEditModalVisible(true);
                                                    editForm.setFieldsValue(
                                                        {
                                                            projectType: 'property',
                                                            projectName: (item as PropertyDeal).projectName,
                                                            address: (item as PropertyDeal).address,
                                                            customerName: (item as PropertyDeal).name,
                                                            customerNumber: (item as PropertyDeal).phone,
                                                            transactionType: (item as PropertyDeal).dealType.charAt(0).toUpperCase() + (item as PropertyDeal).dealType.slice(1),
                                                            transactionAmount: (item as PropertyDeal).transactionAmount,
                                                            dealAmount: (item as PropertyDeal).dealAmount
                                                        }
                                                    );
                                                }}
                                            />

                                            <Button
                                                key="delete"
                                                icon={<DeleteOutlined />}
                                                danger
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedProject(item);
                                                    setIsDeleteModalVisible(true);
                                                }}
                                            />
                                        </div>
                                    </div>



                                    <div className="project-details">
                                        <div className="detail-item">
                                            <span className="label">Customer:</span>
                                            <span className="value">{(item as PropertyDeal).name}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="label">Phone:</span>
                                            <span className="value">{(item as PropertyDeal).phone}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="label">Transaction Type:</span>
                                            <span className="value">{(item as PropertyDeal).dealType.charAt(0).toUpperCase() + (item as PropertyDeal).dealType.slice(1)}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="label">Transaction Amount:</span>
                                            <span className="value">₹{(item as PropertyDeal).transactionAmount?.toLocaleString()}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="label">Deal Amount:</span>
                                            <span className="value">₹{(item as PropertyDeal).dealAmount?.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </Card>
                    </Col>
                ))}
            </Row>
        );
    };



    return (
        <div className="project-list-container">
            <div className="project-list-header">
                <Space>
                    <Button icon={<PlusOutlined />} type="primary" onClick={() => setIsAddModalVisible(true)}>
                        Add Project
                    </Button>
                    <Button icon={<EditOutlined />} onClick={() => setIsEditModalVisible(true)}>
                        Edit Project
                    </Button>
                    <Button icon={<DeleteOutlined />} danger onClick={() => setIsDeleteModalVisible(true)}>
                        Delete Project
                    </Button>
                </Space>
            </div>

            <div className="section-container">
                <h2 className="section-title">Contractor Projects</h2>
                {isMobile ? (
                    renderMobileCards(projects, 'contractor')
                ) : (
                    <Table
                        loading={loading}
                        columns={contractorColumns}
                        dataSource={projects}
                        pagination={false}
                        onRow={(record: ProjectWithDetails) => ({
                            onClick: () => handleProjectClick(record),
                            style: { cursor: 'pointer' }
                        })}
                    />
                )}
            </div>

            <div className="section-container">
                <h2 className="section-title-2">Property Deals</h2>
                {isMobile ? (
                    renderMobileCards(propertyDeals, 'property')
                ) : (
                    <Table
                        loading={loading}
                        columns={propertyColumns}
                        dataSource={propertyDeals}
                        pagination={false}
                    />
                )}
            </div>

            {/* Add Project Modal */}
            <Modal
                title="Add Project"
                open={isAddModalVisible}
                onCancel={() => {
                    setIsAddModalVisible(false);
                    form.resetFields();
                }}
                footer={null}
            >
                <Form form={form} onFinish={handleAddProject} layout="vertical">
                    {renderProjectForm(form)}
                    <Form.Item>
                        <Button type="primary" htmlType="submit">
                            Submit
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Edit Project Modal */}
            <Modal
                title="Edit Project"
                open={isEditModalVisible}
                onCancel={() => {
                    setIsEditModalVisible(false);
                    editForm.resetFields();
                    setSelectedEditProject('');
                }}
                footer={null}
            >
                <Form form={editForm} onFinish={handleEditProject} layout="vertical">
                    <Form.Item
                        name="projectSelect"
                        label="Select Project"
                        rules={[{ required: true, message: 'Please select a project!' }]}
                    >
                        <Select
                            placeholder="Select a project"
                            onChange={handleEditProjectSelect}
                            value={selectedEditProject}
                        >
                            <Select.OptGroup label="Contractor Projects">
                                {projects.map(project => (
                                    <Select.Option key={project.projectId} value={project.projectId}>
                                        {project.name}
                                    </Select.Option>
                                ))}
                            </Select.OptGroup>
                            <Select.OptGroup label="Property Deals">
                                {propertyDeals.map(deal => (
                                    <Select.Option key={deal.dealId} value={deal.dealId}>
                                        {deal.projectName}
                                    </Select.Option>
                                ))}
                            </Select.OptGroup>
                        </Select>
                    </Form.Item>
                    {renderProjectForm(editForm)}
                    <Form.Item>
                        <Button type="primary" htmlType="submit">
                            Update Project
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Delete Modal */}
            <Modal
                title="Delete Project"
                open={isDeleteModalVisible}
                onCancel={() => {
                    setIsDeleteModalVisible(false);
                    setSelectedDeleteProject('');
                }}
                footer={null}
            >
                <Form onFinish={handleDeleteProject} layout="vertical">
                    <Form.Item
                        name="projectSelect"
                        label="Select Project to Delete"
                        rules={[{ required: true, message: 'Please select a project!' }]}
                    >
                        <Select
                            placeholder="Select a project"
                            onChange={setSelectedDeleteProject}
                            value={selectedDeleteProject}
                        >
                            <Select.OptGroup label="Contractor Projects">
                                {projects.map(project => (
                                    <Select.Option key={project.projectId} value={project.projectId}>
                                        {project.name}
                                    </Select.Option>
                                ))}
                            </Select.OptGroup>
                            <Select.OptGroup label="Property Deals">
                                {propertyDeals.map(deal => (
                                    <Select.Option key={deal.dealId} value={deal.dealId}>
                                        {deal.projectName}
                                    </Select.Option>
                                ))}
                            </Select.OptGroup>
                        </Select>
                    </Form.Item>
                    {selectedDeleteProject && (
                        <>
                            <Alert
                                message="Delete Confirmation"
                                description="Are you sure you want to delete this project? This action cannot be undone."
                                type="warning"
                                showIcon
                            />
                            <div style={{ marginTop: '16px', textAlign: 'right' }}>
                                <Space>
                                    <Button onClick={() => setIsDeleteModalVisible(false)}>
                                        Cancel
                                    </Button>
                                    <Button danger type="primary" htmlType="submit">
                                        Delete Project
                                    </Button>
                                </Space>
                            </div>
                        </>
                    )}
                </Form>
            </Modal>

        </div>
    );
};

export default ProjectList;