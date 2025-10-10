import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './addMovement.css';

function AddMovement() {
  const [type, setType] = useState('expense');
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    categoryId: '',
    date: new Date().toISOString().split('T')[0] // ✅ AGREGADO: fecha por defecto (hoy)
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const handleTypeChange = (e) => {
    const newType = e.target.value;
    setType(newType);
    setFormData(prev => ({
      ...prev,
      categoryId: '' // limpiar categoría al cambiar tipo
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('http://localhost:5001/api/movements', {  // ✅ CAMBIADO de 5000 a 5001
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.userId,
          description: formData.description,
          amount: parseFloat(formData.amount),
          categoryId: parseInt(formData.categoryId),
          date: formData.date  // ✅ AGREGADO: enviar la fecha
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        // Resetear formulario
        setFormData({ 
          description: '', 
          amount: '', 
          categoryId: '',
          date: new Date().toISOString().split('T')[0]  // ✅ Resetear fecha
        });
        setType('expense');
        
        // Opcional: redirigir después de un tiempo
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      } else {
        setError(data.error || 'Error al registrar movimiento');
      }
    } catch (error) {
      console.error('Error al registrar movimiento:', error);
      setError('Error al conectar con el servidor');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading">Cargando categorías...</div>;

  const categoriesToShow = categories.filter(cat => cat.type === type);

  return (
    <div className="add-movement-container">
      <header className="movement-header">
        <h2>Registrar Movimiento</h2>
        <Link to="/dashboard" className="back-link">← Volver al Dashboard</Link>
      </header>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">¡Movimiento registrado exitosamente!</div>}

      <form onSubmit={handleSubmit} className="movement-form">
        <div className="form-group">
          <label>Tipo de movimiento:</label>
          <select value={type} onChange={handleTypeChange} disabled={submitting}>
            <option value="expense">Egreso</option>
            <option value="income">Ingreso</option>
          </select>
        </div>

        <div className="form-group">
          <label>Descripción:</label>
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            disabled={submitting}
            placeholder="Ej: Compra supermercado, Pago servicios..."
            maxLength="100"
          />
        </div>

        <div className="form-group">
          <label>Monto:</label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            required
            disabled={submitting}
            min="0.01"
            step="0.01"
            placeholder="0.00"
          />
        </div>

        {/* ✅ AGREGADO: Campo de fecha */}
        <div className="form-group">
          <label>Fecha:</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            disabled={submitting}
            max={new Date().toISOString().split('T')[0]}  // No permitir fechas futuras
          />
        </div>

        <div className="form-group">
          <label>Categoría:</label>
          <select
            name="categoryId"
            value={formData.categoryId}
            onChange={handleChange}
            required
            disabled={submitting}
          >
            <option value="">Selecciona una categoría</option>
            {categoriesToShow.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          {categoriesToShow.length === 0 && (
            <p className="no-categories">
              No hay categorías de {type === 'income' ? 'ingreso' : 'egreso'}. 
              <Link to="/categories"> Crear categorías</Link>
            </p>
          )}
        </div>

        <div className="form-actions">
          <button type="submit" disabled={submitting || categoriesToShow.length === 0} className="submit-btn">
            {submitting ? 'Registrando...' : 'Registrar Movimiento'}
          </button>
          <Link to="/movement-list" className="btn-secondary">
            Ver Historial
          </Link>
        </div>
      </form>
    </div>
  );
}

export default AddMovement;