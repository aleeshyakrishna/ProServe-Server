import request from 'supertest';
import app from '../app';

// Every protected route must reject a request with no token.
// No mocks needed: the real authenticate middleware stops the request
// before anything talks to Supabase or the database.
//
// test.each runs the same test once per row, so adding a route is one line.

const MISSING_TOKEN = 'Authentication token is missing or malformed.';

describe('protected routes reject requests with no token (401)', () => {
    test.each([
        ['GET', '/api/bookings'],
        ['POST', '/api/bookings'],
        ['GET', '/api/users'],
        ['POST', '/api/services'],
        ['DELETE', '/api/services/service-1'],
        ['GET', '/api/auth/me'],
        ['POST', '/api/auth/logout'],
    ])('%s %s', async (method, url) => {
        const agent = request(app);
        const res =
            method === 'GET' ? await agent.get(url)
            : method === 'POST' ? await agent.post(url).send({})
            : await agent.delete(url);

        expect(res.status).toBe(401);
        expect(res.body.message).toBe(MISSING_TOKEN);
    });
});
