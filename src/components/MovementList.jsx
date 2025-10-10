import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './movementList.css';

/**
 * MovementList.jsx
 * Componente completo listo para pegar. Usa las clases del CSS que te pasé.
 */

const formatDate = (dateString) => {
  try {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
};

const formatAmount = (value, type) => {
  const n = Number(value) || 0;
  const sign = type === 'income' ? '+' : '-';
  return `${sign}$${Math.abs(n).toFixed(2)}`;
};

const getUserIdOrError = () => {
  try {
    const stored = JSON.parse(localStorage.getItem('user'));
    if (!stored) return { error: 'Usuario no autenticado' };

    const raw = stored.id ?? stored.userId ?? stored.user_id;
    const num = raw != null ? Number(raw) : NaN;

    if (!Number.isInteger(num) || Number.isNaN(num) || num <= 0) {
      return { error: 'ID de usuario inválido en localStorage', raw };
    }

    return { userId: num, token: stored.token, name: stored.name };
  } catch (err) {
    return { error: 'Error leyendo localStorage', detail: String(err) };
  }
};

function MovementList() {
  const [movements, setMovements] = useState([]);
  const [filteredMovements, setFilteredMovements] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    type: 'all',
    categoryId: 'all',
    date: ''
  });

  const navigate = useNavigate();

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('user'));
    if (!stored) {
      navigate('/');
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movements, filters]);

  const fetchData = async () => {
    setLoading(true);
    const { userId, token, error: uidError, raw } = getUserIdOrError();
    if (uidError) {
      console.error('UserId problem:', uidError, raw);
      setError(uidError);
      setLoading(false);
      return;
    }

    const movementsUrl = `http://localhost:5001/api/movements/${userId}`;
    const categoriesUrl = `http://localhost:5001/api/categories/${userId}`;

    try {
      console.log('Fetching:', movementsUrl, categoriesUrl);

      const movementsResponse = await fetch(movementsUrl, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        }
      });

      if (!movementsResponse.ok) {
        const text = await movementsResponse.text();
        throw new Error(`Movements fetch failed ${movementsResponse.status}: ${text}`);
      }
      const movementsData = await movementsResponse.json();

      const categoriesResponse = await fetch(categoriesUrl, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        }
      });

      if (!categoriesResponse.ok) {
        const text = await categoriesResponse.text();
        throw new Error(`Categories fetch failed ${categoriesResponse.status}: ${text}`);
      }
      const categoriesData = await categoriesResponse.json();

      setMovements(movementsData.movements || []);
      setCategories(categoriesData.categories || []);
      setError(null);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al conectar con el servidor: ' + (err.message || 'fetch failed'));
      setMovements([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...movements];

    if (filters.type !== 'all') {
      filtered = filtered.filter(mov => mov.type === filters.type);
    }

    if (filters.categoryId !== 'all') {
      filtered = filtered.filter(mov => mov.category_id === parseInt(filters.categoryId, 10));
    }

    if (filters.date) {
      filtered = filtered.filter(mov => {
        const movDate = new Date(mov.date).toISOString().split('T')[0];
        return movDate === filters.date;
      });
    }

    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    setFilteredMovements(filtered);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const showToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setFilters(prev => ({ ...prev, date: today }));
  };

  const clearFilters = () => {
    setFilters({ type: 'all', categoryId: 'all', date: '' });
  };

  const handleDelete = async (movementId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este movimiento?')) return;

    const { userId, token, error: uidError } = getUserIdOrError();
    if (uidError) {
      setError(uidError);
      return;
    }

    try {
      const response = await fetch(`http://localhost:5001/api/movements/${movementId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();

      if (response.ok) {
        setMovements(prev => prev.filter(mov => mov.id !== movementId));
        setError(null);
      } else {
        setError(data.error || 'Error al eliminar movimiento');
      }
    } catch (err) {
      console.error('Error al eliminar movimiento:', err);
      setError('Error al conectar con el servidor');
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Sin categoría';
  };

  // Totals calculados solo por filteredMovements (puedes ocultar sección si no la quieres)
  const calculateTotals = () => {
    const income = filteredMovements
      .filter(mov => mov.type === 'income')
      .reduce((sum, mov) => sum + Number(mov.amount || 0), 0);

    const expenses = filteredMovements
      .filter(mov => mov.type === 'expense')
      .reduce((sum, mov) => sum + Number(mov.amount || 0), 0);

    return { income, expenses, balance: income - expenses };
  };

  if (loading) return <div className="loading">Cargando movimientos...</div>;

  const totals = calculateTotals();
  const storedUser = JSON.parse(localStorage.getItem('user')) || {};
  const userName = storedUser.name || 'Usuario';

  return (
    <div className="movement-list-container">
      <div className="movement-list-card">
        <header className="movement-list-header">
          <h2>Historial de Movimientos</h2>
          <div className="header-actions">
            <Link to="/add-movement" className="btn-primary">+ Nuevo Movimiento</Link>
            <Link to="/dashboard" className="back-link">← Dashboard</Link>
          </div>
        </header>

        {error && <div className="error-message">{error}</div>}

        <div className="filters-section">
          <h3>Filtros</h3>
          <div className="filters-grid">
            <div className="filter-group">
              <label>Tipo:</label>
              <select name="type" value={filters.type} onChange={handleFilterChange}>
                <option value="all">Todos</option>
                <option value="income">Ingresos</option>
                <option value="expense">Egresos</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Categoría:</label>
              <select name="categoryId" value={filters.categoryId} onChange={handleFilterChange}>
                <option value="all">Todas</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Fecha específica:</label>
              <input
                type="date"
                name="date"
                value={filters.date}
                onChange={handleFilterChange}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <button onClick={showToday} className="today-btn">Ver Hoy</button>
            <button onClick={clearFilters} className="clear-filters-btn">Ver Todos</button>
          </div>
        </div>

        {/* Totales (puedes eliminar si no los quieres) */}
        <div className="totals-summary" aria-hidden>
          <div className="total-card income">
            <span className="label">Ingresos:</span>
            <span className="amount">+${totals.income.toFixed(2)}</span>
          </div>
          <div className="total-card expense">
            <span className="label">Egresos:</span>
            <span className="amount">-${totals.expenses.toFixed(2)}</span>
          </div>
          <div className="total-card balance">
            <span className="label">Balance:</span>
            <span className={`amount ${totals.balance >= 0 ? 'positive' : 'negative'}`}>
              ${totals.balance.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="summary-info">
          <p>
            Mostrando <strong>{filteredMovements.length}</strong> de <strong>{movements.length}</strong> movimientos
            {filters.date && ` del ${formatDate(filters.date)}`} · Hola, {userName}
          </p>
        </div>

        {filteredMovements.length > 0 ? (
          <div className="table-container" role="region" aria-label="Tabla de movimientos">
            <table className="movement-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Descripción</th>
                  <th>Categoría</th>
                  <th>Tipo</th>
                  <th>Monto</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredMovements.map(mov => (
                  <tr key={mov.id} className={`movement-row ${mov.type}`}>
                    <td>{formatDate(mov.date)}</td>
                    <td>{mov.description}</td>
                    <td>{getCategoryName(mov.category_id)}</td>
                    <td className={mov.type}>{mov.type === 'income' ? 'Ingreso' : 'Egreso'}</td>
                    <td className={`amount ${mov.type}`}>{formatAmount(mov.amount, mov.type)}</td>
                    <td>
                      <button
                        onClick={() => handleDelete(mov.id)}
                        className="delete-btn"
                        title="Eliminar movimiento"
                        aria-label={`Eliminar movimiento ${mov.description}`}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="no-movements">
            <p>
              No hay movimientos {filters.date ? `para el ${formatDate(filters.date)}` : 'que coincidan con los filtros aplicados'}.
            </p>
            <Link to="/add-movement" className="btn-primary">Registrar primer movimiento</Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default MovementList;
