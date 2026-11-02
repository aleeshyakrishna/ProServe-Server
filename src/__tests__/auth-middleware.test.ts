import request from 'supertest';
import app from '../app';
import { supabase } from '../config/supabase';

// Replace the real Supabase client with a fake, so no network call is made.
// The real authenticate middleware still runs; only Supabase is faked.
jest.mock('../config/supabase', () => ({
    supabase: { auth: { getUser: jest.fn() } },
}));

const mockGetUser = supabase.auth.getUser as jest.Mock;

describe('authenticate middleware with a bad token', () => {
    beforeEach(() => {
        // Forget calls from earlier tests so each test starts clean
        mockGetUser.mockReset();
    });

    it('returns 401 when Supabase says the token is invalid', async () => {
        mockGetUser.mockResolvedValue({
            data: { user: null },
            error: { message: 'invalid token' },
        });

        const res = await request(app)
            .post('/api/categories')
            .set('Authorization', 'Bearer fake-token')
            .send({ name: 'Cleaning' });

        expect(res.status).toBe(401);
        expect(res.body.message).toBe('Invalid or expired authentication token.');

        // Proves the middleware pulled the token out of the header and passed it on
        expect(mockGetUser).toHaveBeenCalledWith('fake-token');
    });
});
