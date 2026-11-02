import { runTool } from '../services/assistant/tools';
import { getAllServices, getServiceById } from '../services/service.service';

// runTool is what the AI assistant calls when Gemini asks to use a tool.
// Gemini's arguments are untrusted, so these tests check that bad input is
// rejected safely. The service layer (database) is faked.
jest.mock('../services/service.service', () => ({
    getAllServices: jest.fn(),
    getServiceById: jest.fn(),
}));

const mockGetAllServices = getAllServices as jest.Mock;
const mockGetServiceById = getServiceById as jest.Mock;

const VALID_ID = '3f2b8c1e-4a5d-4e6f-9a7b-1c2d3e4f5a6b';

const makeService = (overrides = {}) => ({
    id: VALID_ID,
    title: 'Deep Home Cleaning',
    category: 'CLEANING',
    price: 200,
    description: 'Full apartment clean',
    isAvailable: true,
    ...overrides,
});

beforeEach(() => {
    jest.resetAllMocks();
});

describe('runTool', () => {
    it('returns an error for a tool name that does not exist', async () => {
        const result = await runTool('deleteAllBookings', {});
        expect(result).toEqual({ ok: false, error: 'Unknown tool: deleteAllBookings' });
    });

    it('rejects invalid arguments without calling the database', async () => {
        const result = await runTool('getServiceDetails', { serviceId: 'not-a-uuid' });

        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error).toMatch(/^Invalid arguments/);
        expect(mockGetServiceById).not.toHaveBeenCalled();
    });

    it('searchServices only asks for available services and returns cards', async () => {
        mockGetAllServices.mockResolvedValue([makeService()]);

        const result = await runTool('searchServices', { category: 'CLEANING', maxPrice: 300 });

        expect(mockGetAllServices).toHaveBeenCalledWith({
            category: 'CLEANING',
            maxPrice: 300,
            isAvailable: true,
        });
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.data).toEqual({
                count: 1,
                services: [
                    {
                        id: VALID_ID,
                        title: 'Deep Home Cleaning',
                        category: 'CLEANING',
                        price: 200,
                        description: 'Full apartment clean',
                    },
                ],
            });
        }
    });

    it('getServiceDetails hides a service that is not available', async () => {
        mockGetServiceById.mockResolvedValue(makeService({ isAvailable: false }));

        const result = await runTool('getServiceDetails', { serviceId: VALID_ID });

        expect(result).toEqual({ ok: false, error: 'Service not found' });
    });

    it('never throws, even when the database fails', async () => {
        mockGetAllServices.mockRejectedValue(new Error('DB down'));

        const result = await runTool('searchServices', {});

        expect(result).toEqual({ ok: false, error: 'Tool failed' });
    });
});
