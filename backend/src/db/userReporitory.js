// backend/src/db/userReporitory.js
import { pool } from '../config/db.config.js';

/**
 * Busca un usuario por email
 */
export async function findUserByEmail(email) {
  const query = `
    SELECT id, name, email, password, created_at 
    FROM users 
    WHERE email = $1
  `;
  
  try {
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error en findUserByEmail:', error);
    throw new Error('Error de base de datos al buscar usuario');
  }
}

/**
 * Crea un nuevo usuario
 * @param {string} name - Nombre del usuario
 * @param {string} email - Email del usuario
 * @param {string} hashedPassword - Contraseña hasheada
 * @returns {Promise<Object>} Usuario creado
 */
export async function createUser(name, email, hashedPassword) {
  const query = `
    INSERT INTO users (name, email, password)
    VALUES ($1, $2, $3)
    RETURNING id, name, email, created_at
  `;
  
  try {
    const result = await pool.query(query, [name, email, hashedPassword]);
    return result.rows[0];
  } catch (error) {
    console.error('Error en createUser:', error);
    
    if (error.code === '23505') {
      throw new Error('El email ya está registrado');
    }
    
    throw new Error('Error de base de datos al crear usuario');
  }
}

/**
 * Busca usuario por ID
 */
export async function findUserById(userId) {
  const query = `
    SELECT id, name, email, created_at 
    FROM users 
    WHERE id = $1
  `;
  
  try {
    const result = await pool.query(query, [userId]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error en findUserById:', error);
    throw new Error('Error de base de datos');
  }
}

/**
 * Actualiza un usuario
 */
export async function updateUser(userId, updateData) {
  const { name, email } = updateData;
  
  const query = `
    UPDATE users 
    SET 
      name = COALESCE($1, name),
      email = COALESCE($2, email)
    WHERE id = $3
    RETURNING id, name, email, created_at
  `;
  
  try {
    const result = await pool.query(query, [name, email, userId]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error en updateUser:', error);
    
    if (error.code === '23505') {
      throw new Error('El email ya está en uso');
    }
    
    throw new Error('Error de base de datos');
  }
}

/**
 * Elimina un usuario
 */
export async function deleteUser(userId) {
  const query = `DELETE FROM users WHERE id = $1 RETURNING id`;
  
  try {
    const result = await pool.query(query, [userId]);
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error en deleteUser:', error);
    throw new Error('Error de base de datos');
  }
}

export default {
  findUserByEmail,
  createUser,
  findUserById,
  updateUser,
  deleteUser
};