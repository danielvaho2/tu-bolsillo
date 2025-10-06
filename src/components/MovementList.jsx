import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './movementList.css';

function MovementList() {
  const [movements, setMovements] = useState([]);
  const [filteredMovements, setFilteredMovements] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  

  const [filters, setFilters] = useState({
    type: 'all', 
    categoryId: 'all',
    dateFrom: '',
    dateTo: ''
  });

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    fetchData();
  }, [user, navigate]);

  useEffect(() => {
    applyFilters();
  }, [movements, filters]);

  const fetchData = async () => {
    try {
     
      const [movementsResponse, categoriesResponse] = await Promise.all([
        fetch(`http://localhost:5001/api/movements/${user.userId}`),
        fetch(`http://localhost:5001/api/categories/${user.userId}`)
      ]);

      const movementsData = await movementsResponse.json();
      const categoriesData = await categoriesResponse.json();

      if (movementsResponse.ok && categoriesResponse.ok) {
        setMovements(movementsData.movements);
        setCategories(categoriesData.categories);
      } else {
        setError('Error al cargar los datos');
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...movements];

    // Filtro por tipo
    if (filters.type !== 'all') {
      filtered = filtered.filter(mov => mov.type === filters.type);
    }

    if (filters.categoryId !== 'all') {
      filtered = filtered.filter(mov => mov.categoryId === parseInt(filters.categoryId));
    }


    if (filters.dateFrom) {
      filtered = filtered.filter(mov => new Date(mov.date) >= new Date(filters.dateFrom));
    }

    if (filters.dateTo) {
      filtered = filtered.filter(mov => new Date(mov.date) <= new Date(filters.dateTo));
    }

    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    setFilteredMovements(filtered);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      type: 'all',
      categoryId: 'all',
      dateFrom: '',
      dateTo: ''
    });
  };

  const handleDelete = async (movementId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este movimiento?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/movements/${movementId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok) {
        setMovements(prev => prev.filter(mov => mov.id !== movementId));
      } else {
        setError(data.error || 'Error al eliminar movimiento');
      }
    } catch (error) {
      console.error('Error al eliminar movimiento:', error);
      setError('Error al conectar con el servidor');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Sin categoría';
  };

  if (loading) return <div className="loading">Cargando movimientos...</div>;

  return (
    <div className="movement-list-container">
      <header className="movement-list-header">
        <h2>Historial de Movimientos</h2>
        <div className="header-actions">
          <Link to="/add-movement" className="btn-primary">+ Nuevo Movimiento</Link>
          <Link to="/dashboard" className="back-link">← Dashboard</Link>
        </div>
      </header>

      {error && <div className="error-message">{error}</div>}

      {/* Filtros */}
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
            <label>Desde:</label>
            <input
              type="date"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleFilterChange}
            />
          </div>

          <div className="filter-group">
            <label>Hasta:</label>
            <input
              type="date"
              name="dateTo"
              value={filters.dateTo}
              onChange={handleFilterChange}
            />
          </div>

          <button onClick={clearFilters} className="clear-filters-btn">
            Limpiar Filtros
          </button>
        </div>
      </div>

      {/* Resumen */}
      <div className="summary-info">
        <p>Mostrando {filteredMovements.length} de {movements.length} movimientos</p>
      </div>

      {/* Tabla de movimientos */}
      {filteredMovements.length > 0 ? (
        <div className="table-container">
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
                  <td>{getCategoryName(mov.categoryId)}</td>
                  <td className={mov.type}>
                    {mov.type === 'income' ? 'Ingreso' : 'Egreso'}
                  </td>
                  <td className={`amount ${mov.type}`}>
                    {mov.type === 'income' ? '+' : '-'}${Math.abs(mov.amount).toFixed(2)}
                  </td>
                  <td>
                    <button 
                      onClick={() => handleDelete(mov.id)}
                      className="delete-btn"
                      title="Eliminar movimiento"
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
          <p>No hay movimientos que coincidan con los filtros aplicados.</p>
          <Link to="/add-movement" className="btn-primary">
            Registrar primer movimiento
          </Link>
        </div>
      )}
    </div>
  );
}

export default MovementList;