import React, { useState, useEffect } from 'react';
import './Dashboard.css';

const Dashboard = ({ isOpen, onClose }) => {
  const [activeView, setActiveView] = useState('dashboard');
  const [inventory, setInventory] = useState([]);
  const [aisles, setAisles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchInventoryData();
      fetchAislesAndCategories();
    }
  }, [isOpen]);

  const fetchInventoryData = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/inventory');
      if (response.ok) {
        const data = await response.json();
        setInventory(data);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAislesAndCategories = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/aisles-categories');
      if (response.ok) {
        const data = await response.json();
        setAisles(data.aisles || []);
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching aisles and categories:', error);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.svg')) {
      setUploadStatus('Please select an SVG file');
      return;
    }

    setLoading(true);
    setUploadStatus('Uploading...');

    try {
      const formData = new FormData();
      formData.append('map', file);

      const response = await fetch('http://localhost:8000/api/upload-map', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setUploadStatus('Map uploaded successfully!');
        // Refresh the map or show success message
      } else {
        setUploadStatus('Upload failed. Please try again.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderDashboard = () => (
    <div className="dashboard-overview">
      <h2>Store Management Dashboard</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <h3>{inventory.length}</h3>
            <p>Total Products</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏪</div>
          <div className="stat-content">
            <h3>{aisles.length}</h3>
            <p>Store Aisles</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏷️</div>
          <div className="stat-content">
            <h3>{categories.length}</h3>
            <p>Categories</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🗺️</div>
          <div className="stat-content">
            <h3>1</h3>
            <p>Store Map</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProductDatabase = () => (
    <div className="product-database">
      <div className="database-header">
        <h2>Product Database</h2>
        <div className="search-bar">
          <input 
            type="text" 
            placeholder="Search products..." 
            className="search-input"
          />
        </div>
      </div>
      
      {loading ? (
        <div className="loading">Loading inventory...</div>
      ) : (
        <div className="inventory-table">
          <div className="table-header">
            <div className="col-name">Product Name</div>
            <div className="col-category">Category</div>
            <div className="col-aisle">Aisle</div>
            <div className="col-description">Description</div>
          </div>
          <div className="table-body">
            {inventory.map((item, index) => (
              <div key={index} className="table-row">
                <div className="col-name">{item.item_name}</div>
                <div className="col-category">{item.category}</div>
                <div className="col-aisle">{item.aisle_location}</div>
                <div className="col-description">{item.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderAislesCategories = () => (
    <div className="aisles-categories">
      <h2>Aisles & Categories</h2>
      
      <div className="aisles-section">
        <h3>Available Aisles</h3>
        <div className="aisles-grid">
          {aisles.map((aisle, index) => (
            <div key={index} className="aisle-card">
              <div className="aisle-id">{aisle}</div>
              <div className="aisle-info">
                <span className="aisle-type">
                  {aisle.startsWith('A') || aisle.startsWith('B') ? 'Grocery' :
                   aisle.startsWith('C') || aisle.startsWith('D') || aisle.startsWith('E') ? 'Apparel & Home' :
                   'General Merchandise'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="categories-section">
        <h3>Product Categories</h3>
        <div className="categories-grid">
          {categories.map((category, index) => (
            <div key={index} className="category-card">
              <div className="category-name">{category}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderUploadMap = () => (
    <div className="upload-map">
      <h2>Upload New Store Map</h2>
      <div className="upload-area">
        <div className="upload-box">
          <div className="upload-icon">🗺️</div>
          <h3>Upload SVG Map</h3>
          <p>Select an SVG file to replace the current store map</p>
          <input
            type="file"
            accept=".svg"
            onChange={handleFileUpload}
            className="file-input"
            id="map-upload"
          />
          <label htmlFor="map-upload" className="upload-button">
            Choose File
          </label>
          {uploadStatus && (
            <div className={`upload-status ${uploadStatus.includes('success') ? 'success' : 'error'}`}>
              {uploadStatus}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return renderDashboard();
      case 'products':
        return renderProductDatabase();
      case 'aisles':
        return renderAislesCategories();
      case 'upload':
        return renderUploadMap();
      default:
        return renderDashboard();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="dashboard-overlay">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="dashboard-title">
            <h1>StorePal Dashboard</h1>
            <span className="dashboard-subtitle">Store Management</span>
          </div>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="dashboard-content">
          <div className="dashboard-sidebar">
            <nav className="dashboard-nav">
              <button 
                className={`nav-item ${activeView === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveView('dashboard')}
              >
                <span className="nav-icon">📊</span>
                <span className="nav-text">Dashboard</span>
              </button>
              <button 
                className={`nav-item ${activeView === 'products' ? 'active' : ''}`}
                onClick={() => setActiveView('products')}
              >
                <span className="nav-icon">📦</span>
                <span className="nav-text">Product Database</span>
              </button>
              <button 
                className={`nav-item ${activeView === 'aisles' ? 'active' : ''}`}
                onClick={() => setActiveView('aisles')}
              >
                <span className="nav-icon">🏪</span>
                <span className="nav-text">Aisles & Categories</span>
              </button>
              <button 
                className={`nav-item ${activeView === 'upload' ? 'active' : ''}`}
                onClick={() => setActiveView('upload')}
              >
                <span className="nav-icon">🗺️</span>
                <span className="nav-text">Upload Map</span>
              </button>
            </nav>
          </div>

          <div className="dashboard-main">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
