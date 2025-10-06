import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './dashboard.css';

function Dashboard() {
  const [financialData, setFinancialData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  
  // Obtener usuario desde localStorage
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (!user) {
      console.error("No hay usuario autenticado");
      navigate('/');
      return;
    }

    const fetchDashboard = async () => {
      try {
        const response = await fetch(`http://localhost:5001/api/dashboard/${user.userId}`);
        const data = await response.json();

        if (response.ok) {
          setFinancialData(data.financialData);
          setCategories(data.categories);
        } else {
          setError(data.error || 'Error al cargar datos del dashboard');
        }
      } catch (error) {
        console.error('Error al cargar datos del dashboard:', error);
        setError('Error al conectar con el servidor');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [user, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  if (loading) return <div className="loading">Cargando dashboard...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!financialData) return <div className="error">No se pudo cargar la información financiera.</div>;

  // Filtrar categorías
  const expenseCategories = categories.filter(cat => cat.type === 'expense');
  const incomeCategories = categories.filter(cat => cat.type === 'income');

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Hola, {user.name}</h1>
          <button onClick={handleLogout} className="logout-btn">
            Cerrar Sesión
          </button>
        </div>
        <nav className="dashboard-nav">
          <Link to="/categories" className="nav-link">Gestionar Categorías</Link>
          <Link to="/add-movement" className="nav-link">Registrar Movimiento</Link>
          <Link to="/movement-list" className="nav-link">Ver Historial</Link>
          <Link to="/analysis" className="nav-link">Análisis Financiero</Link>
        </nav>
      </header>

      <div className="financial-summary">
        <div className="summary-card balance">
          <h2>Saldo Disponible</h2>
          <p className={`amount ${financialData.balance >= 0 ? 'positive' : 'negative'}`}>
            ${financialData.balance.toFixed(2)}
          </p>
        </div>
        <div className="summary-card income">
          <h2>Ingresos Totales</h2>
          <p className="amount positive">${financialData.income.toFixed(2)}</p>
        </div>
        <div className="summary-card expenses">
          <h2>Egresos Totales</h2>
          <p className="amount negative">${financialData.expenses.toFixed(2)}</p>
        </div>
      </div>

      <div className="categories-section">
        <h2>Resumen por Categorías</h2>
        
        <div className="categories-container">
          <div className="category-column">
            <h3>Categorías de Ingresos ({incomeCategories.length})</h3>
            {incomeCategories.length > 0 ? (
              <ul className="category-list">
                {incomeCategories.map(category => (
                  <li key={category.id} className="category-item income">
                    <span className="category-name">{category.name}</span>
                    <span className="category-amount">${category.amount?.toFixed(2) || '0.00'}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-categories">No hay categorías de ingresos</p>
            )}
          </div>

          <div className="category-column">
            <h3>Categorías de Egresos ({expenseCategories.length})</h3>
            {expenseCategories.length > 0 ? (
              <ul className="category-list">
                {expenseCategories.map(category => (
                  <li key={category.id} className="category-item expense">
                    <span className="category-name">{category.name}</span>
                    <span className="category-amount">${category.amount?.toFixed(2) || '0.00'}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-categories">No hay categorías de egresos</p>
            )}
          </div>
        </div>

        <div className="view-all-categories">
          <Link to="/categories" className="btn-link">
            Gestionar todas las categorías
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
