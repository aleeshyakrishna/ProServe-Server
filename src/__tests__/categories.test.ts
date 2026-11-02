import request from 'supertest';
import app from '../app';
import { supabase } from '../config/supabase';
import { UserRepository } from '../repositories/UserRepository';
import { RoleRepository } from '../repositories/RoleRepository';
import {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
} from '../services/category.service';

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
    getAllCategories: jest.fn(),
    getCategoryById: jest.fn(),
    createCategory: jest.fn(),
    updateCategory: jest.fn(),
}));

const mockGetUser = supabase.auth.getUser as jest.Mock;
const mockFindUser = UserRepository.findBySupabaseId as jest.Mock;
const mockFindRoles = RoleRepository.findRolesByUserId as jest.Mock;
const mockGetAllCategories = getAllCategories as jest.Mock;
const mockGetCategory = getCategoryById as jest.Mock;
const mockCreateCategory = createCategory as jest.Mock;
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

describe('GET /api/categories (public)', () => {
    it('returns the list from the service (200)', async () => {
        mockGetAllCategories.mockResolvedValue([
            { id: 'cat-1', name: 'CLEANING', slug: 'cleaning' },
            { id: 'cat-2', name: 'PLUMBING', slug: 'plumbing' },
        ]);

        const res = await request(app).get('/api/categories');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveLength(2);
        expect(res.body.data[0].name).toBe('CLEANING');
        // Public route: no login check at all
        expect(mockGetUser).not.toHaveBeenCalled();
    });
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

    it('rejects an empty name even when logged in (400)', async () => {
        loginAsActiveUser();

        const res = await request(app)
            .post('/api/categories')
            .set('Authorization', 'Bearer valid-token')
            .send({ name: '', slug: 'cleaning' });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Validation Error');
        expect(res.body.errors[0]).toEqual({ field: 'name', message: 'Name is required' });
        // Bad data never reaches the database
        expect(mockCreateCategory).not.toHaveBeenCalled();
    });

    it('rejects a missing slug (400)', async () => {
        loginAsActiveUser();

        const res = await request(app)
            .post('/api/categories')
            .set('Authorization', 'Bearer valid-token')
            .send({ name: 'Cleaning' });

        expect(res.status).toBe(400);
        expect(res.body.errors[0].field).toBe('slug');
        expect(mockCreateCategory).not.toHaveBeenCalled();
    });

    it('creates a category with valid data when logged in (201)', async () => {
        loginAsActiveUser();
        mockCreateCategory.mockResolvedValue({ id: 'cat-1', name: 'CLEANING', slug: 'cleaning' });

        const res = await request(app)
            .post('/api/categories')
            .set('Authorization', 'Bearer valid-token')
            .send({ name: 'Cleaning', slug: 'cleaning' });

        expect(res.status).toBe(201);
        expect(res.body.data.id).toBe('cat-1');
        expect(mockCreateCategory).toHaveBeenCalledWith({ name: 'Cleaning', slug: 'cleaning' });
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
