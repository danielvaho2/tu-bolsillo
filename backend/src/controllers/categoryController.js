/**
 * categoryController.js
 * 
 * Controlador que maneja las operaciones relacionadas con las categorías:
 * - Obtener categorías de un usuario (con totales)
 * - Crear una nueva categoría
 * - Eliminar una categoría existente
 * 
 * Utiliza el servicio `categoryService` para la lógica de negocio.
 */

import * as categoryService from '../services/categoryService.js';

/**
 * 📘 GET /api/categories/:userId
 * 
 * Obtiene todas las categorías de un usuario con los montos totales agregados.
 * 
 * Ejemplo de respuesta exitosa:
 * {
 *   "categories": [
 *     { "id": 1, "name": "Comida", "type": "expense", "amount": 1200 },
 *     { "id": 2, "name": "Salario", "type": "income", "amount": 2500 }
 *   ]
 * }
 */
export const getCategories = async (req, res) => {
  const { userId } = req.params;

  // Validar que el ID sea numérico
  const id = Number.parseInt(userId, 10);
  if (!id || Number.isNaN(id)) {
    return res.status(400).json({ error: 'ID de usuario inválido' });
  }

  try {
    // Llama al servicio para obtener las categorías con sus totales
    const categories = await categoryService.getCategoriesWithTotals(id);
    return res.status(200).json({ categories });
  } catch (error) {
    console.error('❌ Error al obtener categorías con totales:', error.message || error);
    const status = error.status || 500;
    const message = error.message || 'Error al obtener categorías';
    return res.status(status).json({ error: message });
  }
};

/**
 * 📗 POST /api/categories
 * 
 * Crea una nueva categoría para el usuario.
 * 
 * Requiere: `userId`, `name` y `type` en el cuerpo de la solicitud.
 * 
 * Ejemplo:
 * {
 *   "userId": 1,
 *   "name": "Transporte",
 *   "type": "expense"
 * }
 */
export const createCategory = async (req, res) => {
  const { userId, name, type } = req.body;

  // Validar campos obligatorios
  if (!userId || !name || !type) {
    console.warn('⚠️ Faltan campos obligatorios');
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  // Validar tipo
  if (!['income', 'expense'].includes(type)) {
    console.warn('⚠️ Tipo de categoría inválido:', type);
    return res.status(400).json({ error: 'Tipo de categoría inválido' });
  }

  const id = Number.parseInt(userId, 10);
  if (!id || Number.isNaN(id)) {
    console.warn('⚠️ ID de usuario inválido:', userId);
    return res.status(400).json({ error: 'ID de usuario inválido' });
  }

  try {
    const category = await categoryService.create(id, name, type);

    return res.status(201).json({
      message: 'Categoría creada exitosamente',
      category
    });
  } catch (error) {
    console.error('❌ Error capturado en createCategory:', error.message || error);
    const status = error.status || 500;
    const message = error.message || 'Error al crear categoría';
    return res.status(status).json({ error: message });
  }
};

/**
 * 📕 DELETE /api/categories/:categoryId
 * 
 * Elimina una categoría de un usuario, siempre que no tenga transacciones asociadas.
 * 
 * Requiere: `categoryId` como parámetro y `userId` en el cuerpo.
 */
export const deleteCategory = async (req, res) => {
  const { categoryId } = req.params;
  const { userId } = req.body;

  // Validaciones de ID
  if (!categoryId || Number.isNaN(Number.parseInt(categoryId, 10))) {
    return res.status(400).json({ error: 'ID de categoría inválido' });
  }

  const uid = Number.parseInt(userId, 10);
  if (!uid || Number.isNaN(uid)) {
    return res.status(400).json({ error: 'ID de usuario inválido' });
  }

  try {
    const result = await categoryService.remove(Number.parseInt(categoryId, 10), uid);
    return res.status(200).json(result);
  } catch (error) {
    console.error('❌ Error al eliminar categoría:', error.message || error);
    const status = error.status || 500;
    const message = error.message || 'Error al eliminar categoría';
    return res.status(status).json({ error: message });
  }
};

export default {
  getCategories,
  createCategory,
  deleteCategory
};
