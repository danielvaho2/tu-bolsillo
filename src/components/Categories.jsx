import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './categories.css';

function Categories() {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({ name: '', type: 'expense' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    fetchCategories();
  }, [user, navigate]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`http://localhost:5001/api/categories/${user.userId}`);
      const data = await response.json();

      if (response.ok) {
        setCategories(data.categories);
      } else {
        setError(data.error || 'Error al cargar categorías');
      }
    } catch (error) {
      console.error('Error al cargar categorías:', error);
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCategory(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.name.trim()) {
      setError("El nombre de la categoría no puede estar vacío");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5000/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.userId,
          name: newCategory.name.trim(),
          type: newCategory.type
        })
      });

      const data = await response.json();

      if (response.ok) {
        setCategories(prev => [...prev, data.category]);
        setNewCategory({ name: '', type: 'expense' });
      } else {
        setError(data.error || 'Error al crear categoría');
      }
    } catch (error) {
      console.error('Error al crear categoría:', error);
      setError('Error al conectar con el servidor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (categoryId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/categories/${categoryId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok) {
        setCategories(prev => prev.filter(cat => cat.id !== categoryId));
      } else {
        setError(data.error || 'Error al eliminar categoría');
      }
    } catch (error) {
      console.error('Error al eliminar categoría:', error);
      setError('Error al conectar con el servidor');
    }
  };

  if (loading) return <div className="loading">Cargando categorías...</div>;

  const incomeCategories = categories.filter(cat => cat.type === 'income');
  const expenseCategories = categories.filter(cat => cat.type === 'expense');

  return (
    <div className="categories-container">
      <header className="categories-header">
        <h2>Gestión de Categorías</h2>
        <Link to="/dashboard" className="back-link">← Volver al Dashboard</Link>
      </header>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleAddCategory} className="add-category-form">
        <h3>Agregar Nueva Categoría</h3>
        <div className="form-group">
          <input
            type="text"
            name="name"
            placeholder="Nombre de la categoría"
            value={newCategory.name}
            onChange={handleInputChange}
            required
            disabled={submitting}
            maxLength="50"
          />
          <select 
            name="type" 
            value={newCategory.type} 
            onChange={handleInputChange}
            disabled={submitting}
          >
            <option value="expense">Egreso</option>
            <option value="income">Ingreso</option>
          </select>
          <button type="submit" disabled={submitting}>
            {submitting ? 'Agregando...' : 'Agregar'}
          </button>
        </div>
      </form>

      <div className="category-lists">
        <div className="category-section">
          <h3>Categorías de Ingreso ({incomeCategories.length})</h3>
          {incomeCategories.length > 0 ? (
            <ul className="category-list">
              {incomeCategories.map(cat => (
                <li key={cat.id} className="category-item income">
                  <span className="category-name">{cat.name}</span>
                  <button 
                    onClick={() => handleDelete(cat.id)}
                    className="delete-btn"
                    title="Eliminar categoría"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-categories">No hay categorías de ingreso</p>
          )}
        </div>

        <div className="category-section">
          <h3>Categorías de Egreso ({expenseCategories.length})</h3>
          {expenseCategories.length > 0 ? (
            <ul className="category-list">
              {expenseCategories.map(cat => (
                <li key={cat.id} className="category-item expense">
                  <span className="category-name">{cat.name}</span>
                  <button 
                    onClick={() => handleDelete(cat.id)}
                    className="delete-btn"
                    title="Eliminar categoría"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-categories">No hay categorías de egreso</p>
          )}
        </div>
      </div>

      <div className="categories-summary">
        <p>Total de categorías: {categories.length}</p>
        <Link to="/add-movement" className="btn-link">
          Ir a registrar movimiento
        </Link>
      </div>
    </div>
  );
}

export default Categories;