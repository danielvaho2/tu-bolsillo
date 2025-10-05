import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './analysis.css';

function Analysis() {
  const [movements, setMovements] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('all');
  
  const navigate = useNavigate();
  

  const user = useMemo(() => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  }, []);


  const fetchAnalysisData = useCallback(async () => {
    if (!user?.userId) return;

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (dateRange !== 'all') {
        params.append('range', dateRange);
      }

      console.log(`🔍 Haciendo petición a: /api/analysis/${user.userId}?${params}`);

      const response = await fetch(
        `http://localhost:5000/api/analysis/${user.userId}?${params}`
      );
      
      const data = await response.json();

      if (response.ok) {
        console.log('✅ Datos recibidos:', data);
        setMovements(data.movements || []);
        setCategories(data.categories || []);
      } else {
        console.error('❌ Error en respuesta:', data);
        setError(data.error || 'Error al cargar análisis');
      }
    } catch (error) {
      console.error('❌ Error al obtener datos del análisis:', error);
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  }, [user?.userId, dateRange]);


  useEffect(() => {
    if (!user) {
      console.log('🔄 Usuario no encontrado, redirigiendo a login');
      navigate('/login');
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user?.userId) {
      console.log('📊 Cargando datos de análisis...');
      fetchAnalysisData();
    }
  }, [user?.userId, dateRange, fetchAnalysisData]);

  const formatMoney = useCallback((amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(amount);
  }, []);

  if (loading) {
    return (
      <div className="analysis-container">
        <div className="loading">Cargando análisis financiero...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analysis-container">
        <div className="error">
          <p>{error}</p>
          <button onClick={fetchAnalysisData}>Reintentar</button>
        </div>
      </div>
    );
  }


  const incomes = movements.filter(mov => mov.type === 'income');
  const expenses = movements.filter(mov => mov.type === 'expense');
  

  const totalIncome = incomes.reduce((sum, mov) => sum + parseFloat(mov.amount), 0);
  const totalExpense = expenses.reduce((sum, mov) => sum + parseFloat(mov.amount), 0);
  
  const averageIncome = incomes.length > 0 ? totalIncome / incomes.length : 0;
  const averageExpense = expenses.length > 0 ? totalExpense / expenses.length : 0;
  
  const savingsAmount = totalIncome - totalExpense;
  const savingsPercentage = totalIncome > 0 ? (savingsAmount / totalIncome) * 100 : 0;
  
  const balance = totalIncome - totalExpense;
  let financialStatus = "Equilibrado";
  let statusClass = "neutral";
  
  if (balance > 0) {
    financialStatus = "Positivo";
    statusClass = "positive";
  } else if (balance < 0) {
    financialStatus = "Negativo";
    statusClass = "negative";
  }
  
  
  const expenseCategories = categories.filter(cat => cat.type === 'expense');
  const categoryExpenses = expenseCategories.map(category => {
    const categoryMovements = expenses.filter(mov => mov.category_id === category.id);
    const categoryTotal = categoryMovements.reduce((sum, mov) => sum + parseFloat(mov.amount), 0);
    const categoryPercentage = totalExpense > 0 ? (categoryTotal / totalExpense) * 100 : 0;
    const categoryAverage = categoryMovements.length > 0 ? categoryTotal / categoryMovements.length : 0;
    
    return {
      id: category.id,
      name: category.name,
      total: categoryTotal,
      percentage: categoryPercentage,
      average: categoryAverage,
      count: categoryMovements.length
    };
  }).filter(cat => cat.total > 0)
    .sort((a, b) => b.total - a.total);


  const incomeCategories = categories.filter(cat => cat.type === 'income');
  const categoryIncomes = incomeCategories.map(category => {
    const categoryMovements = incomes.filter(mov => mov.category_id === category.id);
    const categoryTotal = categoryMovements.reduce((sum, mov) => sum + parseFloat(mov.amount), 0);
    const categoryPercentage = totalIncome > 0 ? (categoryTotal / totalIncome) * 100 : 0;
    
    return {
      id: category.id,
      name: category.name,
      total: categoryTotal,
      percentage: categoryPercentage,
      count: categoryMovements.length
    };
  }).filter(cat => cat.total > 0)
    .sort((a, b) => b.total - a.total);

  return (
    <div className="analysis-container">
      <header className="analysis-header">
        <h2>Análisis Financiero</h2>
        <nav className="analysis-nav">
          <Link to="/dashboard">← Volver al Dashboard</Link>
        </nav>
      </header>

      {/* Filtro de fechas */}
      <div className="date-filter">
        <label>Período de análisis:</label>
        <select 
          value={dateRange} 
          onChange={(e) => setDateRange(e.target.value)}
        >
          <option value="all">Todo el tiempo</option>
          <option value="month">Último mes</option>
          <option value="3months">Últimos 3 meses</option>
          <option value="6months">Últimos 6 meses</option>
          <option value="year">Último año</option>
        </select>
      </div>

      {movements.length === 0 ? (
        <div className="no-data">
          <p>No hay movimientos para analizar en el período seleccionado.</p>
          <Link to="/add-movement" className="btn-link">
            Agregar primer movimiento
          </Link>
        </div>
      ) : (
        <>
          {/* Resumen general */}
          <div className="analysis-section">
            <h3>Resumen General</h3>
            <div className="summary-grid">
              <div className="summary-item">
                <div className="label">Total movimientos:</div>
                <div className="value">{movements.length}</div>
              </div>
              <div className="summary-item">
                <div className="label">Ingresos:</div>
                <div className="value">{incomes.length}</div>
              </div>
              <div className="summary-item">
                <div className="label">Gastos:</div>
                <div className="value">{expenses.length}</div>
              </div>
            </div>
          </div>

          {/* Promedios */}
          <div className="analysis-section">
            <h3>Promedios</h3>
            <div className="average-box">
              <div className="average-item">
                <div className="label">Ingreso promedio:</div>
                <div className="value income">{formatMoney(averageIncome)}</div>
              </div>
              <div className="average-item">
                <div className="label">Gasto promedio:</div>
                <div className="value expense">{formatMoney(averageExpense)}</div>
              </div>
            </div>
          </div>
          
          {/* Estado financiero */}
          <div className="analysis-section">
            <h3>Estado Financiero</h3>
            <div className="balance-box">
              <div className={`balance-status ${statusClass}`}>{financialStatus}</div>
              <div className="balance-details">
                <div className="balance-item">
                  <div className="label">Total Ingresos:</div>
                  <div className="value income">{formatMoney(totalIncome)}</div>
                </div>
                <div className="balance-item">
                  <div className="label">Total Gastos:</div>
                  <div className="value expense">{formatMoney(totalExpense)}</div>
                </div>
                <div className="balance-item balance-result">
                  <div className="label">Balance:</div>
                  <div className={`value ${statusClass}`}>{formatMoney(balance)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Capacidad de ahorro */}
          <div className="analysis-section">
            <h3>Capacidad de Ahorro</h3>
            <div className="savings-box">
              <div className="savings-bar-container">
                <div 
                  className={`savings-bar ${savingsPercentage < 0 ? 'negative' : ''}`}
                  style={{ width: `${Math.max(0, Math.min(100, Math.abs(savingsPercentage)))}%` }}
                ></div>
              </div>
              <div className={`savings-percentage ${savingsPercentage < 0 ? 'negative' : ''}`}>
                {savingsPercentage.toFixed(1)}%
              </div>
              <div className="savings-description">
                {savingsPercentage >= 20 
                  ? `¡Excelente! Estás ahorrando el ${savingsPercentage.toFixed(1)}% de tus ingresos`
                  : savingsPercentage >= 10 
                  ? `Bien, estás ahorrando el ${savingsPercentage.toFixed(1)}% de tus ingresos`
                  : savingsPercentage > 0 
                  ? `Estás ahorrando el ${savingsPercentage.toFixed(1)}% de tus ingresos, podrías mejorar`
                  : 'Tus gastos superan tus ingresos. Considera revisar tu presupuesto'}
              </div>
            </div>
          </div>
          
          {/* Ingresos por categoría */}
          {categoryIncomes.length > 0 && (
            <div className="analysis-section">
              <h3>Ingresos por Categoría</h3>
              <div className="categories-list">
                {categoryIncomes.map(category => (
                  <div key={category.id} className="category-item income">
                    <div className="category-header">
                      <div className="category-name">
                        {category.name}
                        <span className="category-count">({category.count} movimientos)</span>
                      </div>
                      <div className="category-amount">
                        {formatMoney(category.total)}
                        <span className="category-percent">
                          ({category.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    <div className="category-bar-container">
                      <div 
                        className="category-bar income"
                        style={{ width: `${category.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gastos por categoría */}
          {categoryExpenses.length > 0 && (
            <div className="analysis-section">
              <h3>Gastos por Categoría</h3>
              <div className="categories-list">
                {categoryExpenses.map(category => (
                  <div key={category.id} className="category-item expense">
                    <div className="category-header">
                      <div className="category-name">
                        {category.name}
                        <span className="category-count">({category.count} movimientos)</span>
                      </div>
                      <div className="category-amount">
                        {formatMoney(category.total)}
                        <span className="category-percent">
                          ({category.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    <div className="category-bar-container">
                      <div 
                        className="category-bar expense"
                        style={{ width: `${category.percentage}%` }}
                      ></div>
                    </div>
                    <div className="category-details">
                      <small>Promedio: {formatMoney(category.average)}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recomendaciones */}
          <div className="analysis-section">
            <h3>Recomendaciones</h3>
            <div className="recommendations">
              {savingsPercentage < 10 && (
                <div className="recommendation warning">
                  💡 Intenta ahorrar al menos el 10% de tus ingresos
                </div>
              )}
              {categoryExpenses.length > 0 && categoryExpenses[0].percentage > 50 && (
                <div className="recommendation warning">
                  ⚠️ La categoría "{categoryExpenses[0].name}" representa más del 50% de tus gastos
                </div>
              )}
              {balance > 0 && savingsPercentage >= 20 && (
                <div className="recommendation success">
                  ✅ ¡Excelente manejo financiero! Mantienes un buen equilibrio
                </div>
              )}
              {expenses.length > incomes.length * 3 && (
                <div className="recommendation info">
                  📊 Tienes muchas transacciones pequeñas, considera consolidar gastos
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Analysis;