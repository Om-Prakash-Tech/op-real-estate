import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Layout, Menu, Button, Modal, Spin, message } from 'antd';
import { useMediaQuery } from '@mui/material';
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  TeamOutlined,
  SettingOutlined,
  LogoutOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import Login from './components/Login/Login';
import Home from './components/Home/Home';
import AddContractor from './components/AddContractor/AddContractor';
import ProjectList from './components/ProjectList/ProjectList';
import ProjectHistory from './components/ProjectHistory/ProjectHistory';
import BuySell from './components/BuySell/BuySell';
import ContractorList from './components/ContractorList/ContractorList';
import ContractorHistory from './components/ContractorHistory/ContractorHistory';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { app } from './Firebase';
import './App.css';

const { Header, Sider, Content, Footer } = Layout;


const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const auth = getAuth(app);
  const user = auth.currentUser;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  const mdUp = useMediaQuery('(min-width:767px)');
  const [collapsed, setCollapsed] = useState(false);
  const [showModal, setShowModal] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth(app);

    // Check for stored user data
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setIsLoggedIn(true);
    }

    // Setup auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoading(false);

      if (user) {
        setIsLoggedIn(true);

        try {
          // Get fresh token on auth state change
          const token = await user.getIdToken();
          localStorage.setItem('token', token);
          localStorage.setItem('lastTokenRefresh', Date.now().toString());

          // Update user info
          localStorage.setItem('user', JSON.stringify({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
          }));
        } catch (error) {
          console.error('Token refresh error:', error);
        }
      } else {
        setIsLoggedIn(false);
        localStorage.removeItem('token');
        localStorage.removeItem('lastTokenRefresh');
        localStorage.removeItem('user');
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleModalClose = () => {
    setShowModal(null);
  };

  const handleLogout = async () => {
    try {
      const auth = getAuth(app);
      await signOut(auth);
      localStorage.clear();
      setIsLoggedIn(false);
      message.success('Successfully logged out');
    } catch (error) {
      console.error('Logout error:', error);
      message.error('Failed to logout. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  const items = [
    { key: '/', icon: <AppstoreOutlined />, label: <Link to="/">Transaction List</Link> },
    { key: '/projects', icon: <BarChartOutlined />, label: <Link to="/projects">Project List</Link> },
    {
      key: '/contractors',
      icon: <TeamOutlined />,
      label: <Link to="/contractors">Contractor List</Link>
    },
    {
      key: '/buysell',
      icon: <ShoppingCartOutlined />,
      label: <Link to="/buysell">Buy/Sell</Link>
    },
    {
      key: '/logout',
      icon: <LogoutOutlined />,
      label: <a onClick={handleLogout}>Logout</a>,
    },
  ];

  const mobileItems = [
    {
      label: 'Menu',
      key: 'SubMenu',
      icon: <SettingOutlined />,
      children: items,
    },
  ];

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!isLoggedIn ? <Login /> : <Navigate to="/" replace />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                {mdUp && (
                  <Sider
                    trigger={null}
                    collapsible
                    collapsed={collapsed}
                    style={{
                      overflow: 'auto',
                      height: '100vh',
                    }}
                  >
                    <div className="logo" />
                    <Menu
                      theme="dark"
                      mode="inline"
                      defaultSelectedKeys={['/']}
                      items={items}
                    />
                  </Sider>
                )}

                <Layout>
                  <Header style={{ padding: 0, background: 'white' }}>
                    {mdUp ? (
                      <Button
                        type="text"
                        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={() => setCollapsed(!collapsed)}
                        style={{
                          fontSize: '16px',
                          width: 64,
                          height: 64,
                        }}
                      />
                    ) : (
                      <Menu
                        selectedKeys={['/']}
                        mode="horizontal"
                        items={mobileItems}
                      />
                    )}
                  </Header>

                  <Content
                    style={{
                      marginLeft: '10px',
                      marginRight: '10px',
                      marginTop: '12px',
                      padding: 12,
                      minHeight: 280,
                    }}
                  >
                    <Routes>
                      <Route path="/" element={<Home/>} />
                      <Route path="/projects" element={<ProjectList />} />
                      <Route path="/project-history/:projectId" element={<ProjectHistory />} />
                      <Route path="/buysell" element={<BuySell />} />
                      <Route path="/contractors" element={<ContractorList />} />
                      <Route path="/contractor-history/:contractorId" element={<ContractorHistory />} />
                    </Routes> 
                  </Content>

                  <Footer style={{ textAlign: 'center', padding: '10px' }}>
                    Om Prakash ©{new Date().getFullYear()}
                  </Footer>
                </Layout>

                <Modal
                  title="Add Contractor"
                  open={showModal === 'addContractor'}
                  onCancel={handleModalClose}
                  footer={null}
                >
                  <AddContractor />
                </Modal>

            
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;

