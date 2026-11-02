import { createCategorySchema } from '../validations/category.schema';
import { createServiceSchema } from '../validations/service.schema';
import { createBookingSchema } from '../validations/booking.schema';

// Plain unit tests: no app, no Supertest, no mocks.
// We call the Zod schema directly and check what it accepts and rejects.

describe('createCategorySchema', () => {
    it('accepts a valid category', () => {
        const result = createCategorySchema.safeParse({ name: 'Cleaning', slug: 'cleaning' });
        expect(result.success).toBe(true);
    });

    it('rejects an empty name', () => {
        const result = createCategorySchema.safeParse({ name: '', slug: 'cleaning' });
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe('Name is required');
    });

    it('rejects a name over 50 characters', () => {
        const result = createCategorySchema.safeParse({ name: 'a'.repeat(51), slug: 'cleaning' });
        expect(result.success).toBe(false);
    });
});

describe('createServiceSchema', () => {
    const validService = {
        title: 'Deep Home Cleaning',
        description: 'Full apartment clean',
        category: 'CLEANING',
        price: 200,
        providerId: 'provider-1',
    };

    it('accepts a valid service and defaults isAvailable to true', () => {
        const result = createServiceSchema.safeParse(validService);
        expect(result.success).toBe(true);
        expect(result.data?.isAvailable).toBe(true);
    });

    it('rejects a negative price', () => {
        const result = createServiceSchema.safeParse({ ...validService, price: -50 });
        expect(result.success).toBe(false);
    });

    it('rejects a category that does not exist', () => {
        const result = createServiceSchema.safeParse({ ...validService, category: 'GARDENING' });
        expect(result.success).toBe(false);
    });
});

describe('createBookingSchema', () => {
    it('rejects a booking in the past', () => {
        const result = createBookingSchema.safeParse({
            userId: 'user-1',
            serviceId: 'service-1',
            scheduledAt: '2020-01-01T10:00:00Z',
        });
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe('scheduledAt must be a future date');
    });
});
