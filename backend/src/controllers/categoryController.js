// backend/src/controllers/categoryController.js
import * as categoryService from '../services/categoryService.js';

/**
 * Obtiene todas las categorías de un usuario
 * GET /api/categories/:userId
 */
export const getCategories = async (req, res) => {
  const { userId } = req.params;

  if (!userId || isNaN(parseInt(userId, 10))) {
    return res.status(400).json({ error: 'ID de usuario inválido' });
  }

  try {
    const categories = await categoryService.get(parseInt(userId, 10));
    return res.status(200).json({ categories });
  } catch (error) {
    console.error('Error al obtener categorías:', error.message);
    const status = error.status || 500;
    const message = error.message || 'Error al obtener categorías';
    return res.status(status).json({ error: message });
  }
};

/**
 * Crea una nueva categoría
 * POST /api/categories
 */
export const createCategory = async (req, res) => {
  const { userId, name, type } = req.body;

  if (!userId || !name || !type) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  if (!['income', 'expense'].includes(type)) {
    return res.status(400).json({ error: 'Tipo de categoría inválido' });
  }

  try {
    const category = await categoryService.create(
      parseInt(userId, 10),
      name,
      type
    );

    return res.status(201).json({
      message: 'Categoría creada exitosamente',
      category
    });
  } catch (error) {
    console.error('Error al crear categoría:', error.message);
    const status = error.status || 500;
    const message = error.message || 'Error al crear categoría';
    return res.status(status).json({ error: message });
  }
};

/**
 * Elimina una categoría
 * DELETE /api/categories/:categoryId
 */
export const deleteCategory = async (req, res) => {
  const { categoryId } = req.params;
  const { userId } = req.body;

  if (!categoryId || isNaN(parseInt(categoryId, 10))) {
    return res.status(400).json({ error: 'ID de categoría inválido' });
  }

  if (!userId || isNaN(parseInt(userId, 10))) {
    return res.status(400).json({ error: 'ID de usuario inválido' });
  }

  try {
    const result = await categoryService.remove(
      parseInt(categoryId, 10),
      parseInt(userId, 10)
    );
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error al eliminar categoría:', error.message);
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