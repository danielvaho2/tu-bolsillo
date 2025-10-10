import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './dashboard.css';

function Dashboard() {
  const [categories, setCategories] = useState([]);
  const [movements, setMovements] = useState([]);
  const [totals, setTotals] = useState({ income: 0, expense: 0, balance: 0 });
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const userId = user.id || user.userId;
      const token = user.token || '';

      const [movementsRes, categoriesRes] = await Promise.all([
        fetch(`http://localhost:5001/api/movements/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`http://localhost:5001/api/categories/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const movementsData = await movementsRes.json();
      const categoriesData = await categoriesRes.json();

      setMovements(movementsData.movements || []);
      setCategories(categoriesData.categories || []);
      calculateTotals(movementsData.movements || []);
    } catch (err) {
      console.error('Error al cargar dashboard:', err);
    }
  };

  const calculateTotals = (movs) => {
    const income = movs.filter(m => m.type === 'income').reduce((sum, m) => sum + Number(m.amount || 0), 0);
    const expense = movs.filter(m => m.type === 'expense').reduce((sum, m) => sum + Number(m.amount || 0), 0);
    setTotals({ income, expense, balance: income - expense });
  };

  const formatAmount = (value) => `$${Number(value || 0).toLocaleString('es-CO', { minimumFractionDigits: 2 })}`;

  const incomeCategories = categories.filter(cat => cat.type === 'income');
  const expenseCategories = categories.filter(cat => cat.type === 'expense');

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Hola, {user.name}</h1>
          <button className="logout-btn" onClick={() => {
            localStorage.removeItem('user');
            navigate('/');
          }}>Cerrar Sesión</button>
        </div>
        <div className="dashboard-nav">
          <Link to="/categories" className="nav-link">Gestionar Categorías</Link>
          <Link to="/add-movement" className="nav-link">Registrar Movimiento</Link>
          <Link to="/movement-list" className="nav-link">Ver Historial</Link>
          <Link to="/analysis" className="nav-link">Análisis Financiero</Link>
        </div>
      </div>

      <div className="financial-summary">
        <div className="summary-card balance">
          <h2>SALDO DISPONIBLE</h2>
          <p className={`amount ${totals.balance >= 0 ? 'positive' : 'negative'}`}>
            {formatAmount(totals.balance)}
          </p>
        </div>
        <div className="summary-card income">
          <h2>INGRESOS TOTALES</h2>
          <p className="amount">{formatAmount(totals.income)}</p>
        </div>
        <div className="summary-card expenses">
          <h2>EGRESOS TOTALES</h2>
          <p className="amount">{formatAmount(totals.expense)}</p>
        </div>
      </div>

      <div className="categories-section">
        <h2>Resumen por Categorías</h2>
        <div className="categories-container">
          <div className="category-column">
            <h3>Categorías de Ingresos ({incomeCategories.length})</h3>
            <ul className="category-list">
              {incomeCategories.length > 0 ? incomeCategories.map(cat => (
                <li key={cat.id} className="category-item income">
                  <span className="category-name">{cat.name}</span>
                  <span className="category-amount">{formatAmount(cat.amount)}</span>
                </li>
              )) : <div className="no-categories">No hay categorías de ingreso</div>}
            </ul>
          </div>
          <div className="category-column">
            <h3>Categorías de Egresos ({expenseCategories.length})</h3>
            <ul className="category-list">
              {expenseCategories.length > 0 ? expenseCategories.map(cat => (
                <li key={cat.id} className="category-item expense">
                  <span className="category-name">{cat.name}</span>
                  <span className="category-amount">{formatAmount(cat.amount)}</span>
                </li>
              )) : <div className="no-categories">No hay categorías de egreso</div>}
            </ul>
          </div>
        </div>
        <div className="view-all-categories">
          <Link to="/categories" className="btn-link">Ver todas las categorías</Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
