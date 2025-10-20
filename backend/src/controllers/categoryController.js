import * as categoryService from '../services/categoryService.js';

/**
 * Obtiene todas las categorías de un usuario con totales agregados
 * GET /api/categories/:userId
 */
export const getCategories = async (req, res) => {
  const { userId } = req.params;

  const id = Number.parseInt(userId, 10);
  if (!id || Number.isNaN(id)) {
    return res.status(400).json({ error: 'ID de usuario inválido' });
  }

  try {
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
 * Crea una nueva categoría
 * POST /api/categories
 */
export const createCategory = async (req, res) => {
  const { userId, name, type } = req.body;

  

  if (!userId || !name || !type) {
    console.warn('⚠️ Faltan campos obligatorios');
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

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
 * Elimina una categoría
 * DELETE /api/categories/:categoryId
 */
export const deleteCategory = async (req, res) => {
  const { categoryId } = req.params;
  const { userId } = req.body;

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
