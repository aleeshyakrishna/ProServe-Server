import request from 'supertest';
import app from '../app';
import { supabase } from '../config/supabase';
import { UserRepository } from '../repositories/UserRepository';
import { RoleRepository } from '../repositories/RoleRepository';

// Replace the real Supabase client and the user/role repositories with fakes,
// so no network call or database query is made.
// The real authenticate and requireRoles middleware still run.
jest.mock('../config/supabase', () => ({
    supabase: { auth: { getUser: jest.fn() } },
}));

jest.mock('../repositories/UserRepository', () => ({
    UserRepository: { findBySupabaseId: jest.fn() },
}));

jest.mock('../repositories/RoleRepository', () => ({
    RoleRepository: { findRolesByUserId: jest.fn() },
}));

const mockGetUser = supabase.auth.getUser as jest.Mock;
const mockFindUser = UserRepository.findBySupabaseId as jest.Mock;
const mockFindRoles = RoleRepository.findRolesByUserId as jest.Mock;

// Supabase accepts the token and returns this user id
const supabaseAcceptsToken = () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'supabase-user-1' } }, error: null });
};

const activeUser = {
    id: 'user-1',
    email: 'test@proserve.test',
    name: 'Test User',
    status: 'active',
};

beforeEach(() => {
    // Forget calls and fake answers from earlier tests so each test starts clean
    jest.resetAllMocks();
});

describe('authenticate middleware', () => {
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

    it('treats a header without "Bearer " as a missing token (401)', async () => {
        const res = await request(app)
            .post('/api/categories')
            .set('Authorization', 'abc123')
            .send({ name: 'Cleaning' });

        expect(res.status).toBe(401);
        expect(res.body.message).toBe('Authentication token is missing or malformed.');
        expect(mockGetUser).not.toHaveBeenCalled();
    });

    it('reads the token from the ps_access_token cookie', async () => {
        mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'invalid token' } });

        await request(app)
            .post('/api/categories')
            .set('Cookie', 'ps_access_token=cookie-token')
            .send({ name: 'Cleaning' });

        expect(mockGetUser).toHaveBeenCalledWith('cookie-token');
    });

    it('returns 404 when the Supabase user has no local account', async () => {
        supabaseAcceptsToken();
        mockFindUser.mockResolvedValue(undefined);

        const res = await request(app)
            .post('/api/categories')
            .set('Authorization', 'Bearer valid-token')
            .send({ name: 'Cleaning' });

        expect(res.status).toBe(404);
        expect(res.body.message).toBe('Local account not found. Please re-register or contact support.');
        expect(mockFindUser).toHaveBeenCalledWith('supabase-user-1');
    });

    it('returns 403 when the account is not active', async () => {
        supabaseAcceptsToken();
        mockFindUser.mockResolvedValue({ ...activeUser, status: 'suspended' });

        const res = await request(app)
            .post('/api/categories')
            .set('Authorization', 'Bearer valid-token')
            .send({ name: 'Cleaning' });

        expect(res.status).toBe(403);
        expect(res.body.message).toBe('Your account is currently suspended. Access denied.');
        // Stopped before loading roles
        expect(mockFindRoles).not.toHaveBeenCalled();
    });
});

describe('requireRoles middleware', () => {
    it('returns 403 when a CUSTOMER tries an ADMIN-only route', async () => {
        supabaseAcceptsToken();
        mockFindUser.mockResolvedValue(activeUser);
        mockFindRoles.mockResolvedValue([{ name: 'CUSTOMER' }]);

        // DELETE /api/services/:id is ADMIN only
        const res = await request(app)
            .delete('/api/services/service-1')
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(403);
        expect(res.body.message).toBe('Access denied. Required role(s): ADMIN.');
    });
});
