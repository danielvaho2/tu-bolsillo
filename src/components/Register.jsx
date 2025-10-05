import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './register.css';

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const validateForm = () => {
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password })
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ Registro exitoso:', data);
        

        localStorage.setItem('user', JSON.stringify({
          userId: data.userId,
          name: data.name,
          email: data.email
        }));
        
        navigate('/dashboard');
      } else {
        setError(data.error || 'Error al registrar usuario');
      }
    } catch (err) {
      console.error('❌ Error en la solicitud:', err);
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <form className="formulario" onSubmit={handleSubmit}>
        <h2>Registro</h2>
        
        <input 
          type="text" 
          placeholder="Nombre completo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required 
          disabled={loading}
        />
        
        <input 
          type="email" 
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required 
          disabled={loading}
        />
        
        <input 
          type="password" 
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required 
          disabled={loading}
        />
        
        <input 
          type="password" 
          placeholder="Confirmar contraseña"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required 
          disabled={loading}
        />
        
        <button type="submit" disabled={loading}>
          {loading ? 'Registrando...' : 'Registrarse'}
        </button>
        
        {error && <p style={{ color: 'red' }}>{error}</p>}
        
        <p className="login-link">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión aquí</Link>
        </p>
      </form>
    </div>
  );
}

export default Register;