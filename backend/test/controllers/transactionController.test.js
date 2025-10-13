import request from 'supertest';
import app from '../../src/config/appConfig.js';

describe('Transaction Controller', () => {
  let userId;
  let categoryId;

  beforeAll(async () => {
    // Crea un usuario de prueba
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Usuario Test',
        email: `test${Date.now()}@mail.com`,
        password: '123456'
      });

    console.log('🧪 Respuesta al registrar usuario:', userRes.body);
    console.log('🧪 Código de estado al registrar usuario:', userRes.statusCode);

    userId = userRes.body.userId;
    console.log('🧪 userId obtenido:', userId);

    // Crea una categoría para ese usuario
    const categoryRes = await request(app)
      .post('/api/categories')
      .set('Content-Type', 'application/json') // ✅ fuerza el tipo correcto
      .send({
        userId,
        name: `Categoría de prueba ${Date.now()}`,
        type: 'expense'
      });

    console.log('🧪 Código de estado al crear categoría:', categoryRes.statusCode);
    console.log('🧪 Respuesta al crear categoría:', categoryRes.body);

    if (!categoryRes.body.category) {
      console.log('❌ No se devolvió la categoría. Respuesta completa:', categoryRes.body);
      throw new Error('No se pudo crear la categoría correctamente');
    }

    categoryId = categoryRes.body.category.id;
    console.log('🧪 categoryId obtenido:', categoryId);
  });

  test('POST /api/transactions crea un movimiento válido', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .send({
        userId,
        description: 'Compra de libros',
        amount: 50,
        categoryId,
        date: '2025-10-10'
      });

    console.log('🧪 Código de estado al crear transacción:', res.statusCode);
    console.log('🧪 Respuesta al crear transacción:', res.body);

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Movimiento registrado exitosamente');
    expect(res.body.movement).toBeDefined();
  });
});
