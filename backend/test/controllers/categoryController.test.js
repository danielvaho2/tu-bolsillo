import request from 'supertest';
import app from '../../src/config/appConfig.js';

describe('Category Controller', () => {
  test('GET /api/categories/:userId devuelve 200 y lista de categorías', async () => {
    const res = await request(app).get('/api/categories/1');

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.categories)).toBe(true);
  });

  afterAll(async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
  });
});
