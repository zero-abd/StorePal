import React, { useState, useEffect, useMemo } from 'react';
import './Dashboard.css';
import { loadCatalog } from './search';

const naturalAisleSort = (a, b) =>
  a[0] === b[0] ? parseInt(a.slice(1), 10) - parseInt(b.slice(1), 10) : a.localeCompare(b);

// Read-only view of the WinMart catalog, loaded from public/inventory.json.
const Dashboard = ({ isOpen, onClose }) => {
  const [activeView, setActiveView] = useState('dashboard');
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (!isOpen || inventory.length) return;
    setLoading(true);
    loadCatalog()
      .then(setInventory)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [isOpen, inventory.length]);

  const aisles = useMemo(
    () => [...new Set(inventory.map((i) => i.aisle))].sort(naturalAisleSort),
    [inventory]
  );
  const categories = useMemo(
    () => [...new Set(inventory.map((i) => i.category))].sort(),
    [inventory]
  );
  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return inventory;
    return inventory.filter((i) =>
      `${i.name} ${i.category} ${i.aisle} ${i.description}`.toLowerCase().includes(q)
    );
  }, [inventory, filter]);

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
            placeholder="Filter products..."
            className="search-input"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>
      
      {error ? (
        <div className="loading">{error}</div>
      ) : loading ? (
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
            {filtered.map((item) => (
              <div key={item.id} className="table-row">
                <div className="col-name">{item.name}</div>
                <div className="col-category">{item.category}</div>
                <div className="col-aisle">{item.aisle}</div>
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

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return renderDashboard();
      case 'products':
        return renderProductDatabase();
      case 'aisles':
        return renderAislesCategories();
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
