import request from 'supertest'
import app from '../app'

describe('POST /api/categories', () => {
    it('rejects a request with no token (401)', async () => {
        const res = await request(app).post('/api/categories').send({ name: 'Cleaning' })

        expect(res.status).toBe(401)
    })
})