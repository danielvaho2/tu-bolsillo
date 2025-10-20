import request from 'supertest';
import app from '../../src/config/appConfig.js';

describe('Transaction Controller', () => {
  let userId;
  let categoryId;

  beforeAll(async () => {
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Usuario Test',
        email: `test${Date.now()}@mail.com`,
        password: '123456'
      });

    userId = userRes.body.userId;

    const categoryRes = await request(app)
      .post('/api/categories')
      .set('Content-Type', 'application/json')
      .send({
        userId,
        name: `Categoría de prueba ${Date.now()}`,
        type: 'expense'
      });

    if (!categoryRes.body.category) {
      console.log('❌ No se devolvió la categoría. Respuesta completa:', categoryRes.body);
      throw new Error('No se pudo crear la categoría correctamente');
    }

    categoryId = categoryRes.body.category.id;
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

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Movimiento registrado exitosamente');
    expect(res.body.movement).toBeDefined();
  });

  test('GET /api/transactions/:userId devuelve los movimientos del usuario', async () => {
    const res = await request(app)
      .get(`/api/transactions/${userId}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.movements)).toBe(true);
    expect(res.body.movements.length).toBeGreaterThan(0);

    const movimiento = res.body.movements.find(m => m.category_id === categoryId);
    expect(movimiento).toBeDefined();
    expect(movimiento.description).toBe('Compra de libros');
    expect(parseFloat(movimiento.amount)).toBe(50);
  });

  // 👇 importante para evitar el error del entorno cerrado
  afterAll(async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
  });
});
