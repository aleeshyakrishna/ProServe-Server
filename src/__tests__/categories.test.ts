import request from 'supertest';
import app from '../app';
import { supabase } from '../config/supabase';
import { UserRepository } from '../repositories/UserRepository';
import { RoleRepository } from '../repositories/RoleRepository';
import { getCategoryById, updateCategory } from '../services/category.service';

// Only things OUTSIDE our code are faked: Supabase (network) and the
// repositories/service (database). The real authenticate middleware,
// validation, controller and error handler all run for real.
jest.mock('../config/supabase', () => ({
    supabase: { auth: { getUser: jest.fn() } },
}));

jest.mock('../repositories/UserRepository', () => ({
    UserRepository: { findBySupabaseId: jest.fn() },
}));

jest.mock('../repositories/RoleRepository', () => ({
    RoleRepository: { findRolesByUserId: jest.fn() },
}));

jest.mock('../services/category.service', () => ({
    getCategoryById: jest.fn(),
    updateCategory: jest.fn(),
}));

const mockGetUser = supabase.auth.getUser as jest.Mock;
const mockFindUser = UserRepository.findBySupabaseId as jest.Mock;
const mockFindRoles = RoleRepository.findRolesByUserId as jest.Mock;
const mockGetCategory = getCategoryById as jest.Mock;
const mockUpdateCategory = updateCategory as jest.Mock;

const MISSING_TOKEN = 'Authentication token is missing or malformed.';

// Makes every mock behave like a valid, logged-in, active user
const loginAsActiveUser = () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'supabase-user-1' } }, error: null });
    mockFindUser.mockResolvedValue({
        id: 'user-1',
        email: 'test@proserve.test',
        name: 'Test User',
        status: 'active',
    });
    mockFindRoles.mockResolvedValue([{ name: 'ADMIN' }]);
};

beforeEach(() => {
    jest.resetAllMocks();
});

describe('POST /api/categories', () => {
    it('rejects a request with no token (401)', async () => {
        const res = await request(app)
            .post('/api/categories')
            .send({ name: 'Cleaning', slug: 'cleaning' });

        expect(res.status).toBe(401);
        expect(res.body.message).toBe(MISSING_TOKEN);
        // Stopped before even asking Supabase
        expect(mockGetUser).not.toHaveBeenCalled();
    });
});

describe('PUT /api/categories/:id', () => {
    it('rejects a request with no token (401)', async () => {
        const res = await request(app)
            .put('/api/categories/test-category-id')
            .send({ name: 'Updated Cleaning' });

        expect(res.status).toBe(401);
        expect(res.body.message).toBe(MISSING_TOKEN);
        expect(mockUpdateCategory).not.toHaveBeenCalled();
    });

    it('successfully updates a category when authenticated (200)', async () => {
        loginAsActiveUser();
        mockGetCategory.mockResolvedValue({ id: 'test-category-id', name: 'CLEANING' });
        mockUpdateCategory.mockResolvedValue({ id: 'test-category-id', name: 'UPDATED CLEANING' });

        const res = await request(app)
            .put('/api/categories/test-category-id')
            .set('Authorization', 'Bearer valid-token')
            .send({ name: 'Updated Cleaning' });

        expect(res.status).toBe(200);
        expect(res.body.data.name).toBe('UPDATED CLEANING');
        expect(mockGetUser).toHaveBeenCalledWith('valid-token');
        expect(mockUpdateCategory).toHaveBeenCalledWith('test-category-id', { name: 'Updated Cleaning' });
    });
});

describe('DELETE /api/categories/:id', () => {
    it('rejects a request with no token (401)', async () => {
        const res = await request(app)
            .delete('/api/categories/test-category-id');

        expect(res.status).toBe(401);
        expect(res.body.message).toBe(MISSING_TOKEN);
        expect(mockGetCategory).not.toHaveBeenCalled();
    });
});
