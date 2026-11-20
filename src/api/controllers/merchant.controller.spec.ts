import type { Merchant } from '../schemas/merchant.schema.js';
import type { MerchantService } from '../services/merchant.service.js';
import { MerchantController } from './merchant.controller.js';
import { fromPartial } from '@total-typescript/shoehorn';

describe('MerchantController', () => {
        let service: jest.Mocked<MerchantService>;
        let controller: MerchantController;

	const samplePlace: Merchant = {
		id: 'p1',
		name: 'Store',
		customName: 'My Store',
		category: {
			id: 'c1',
			name: 'Food',
			description: null,
			icon: 'food-icon',
			isDefault: true,
			createdAt: new Date('2024-12-31T00:00:00Z'),
		},
	};

        beforeEach(() => {
                service = fromPartial<jest.Mocked<MerchantService>>({
                        getAllMerchants: jest.fn(),
                        getMerchantById: jest.fn(),
                        addMerchant: jest.fn(),
                });
                controller = new MerchantController(service);
	});

	describe('getAllMerchants', () => {
		it('returns merchants from service', async () => {
			service.getAllMerchants.mockResolvedValue([samplePlace]);
                        const result = await controller.getAllMerchants('user1');
                        expect(service.getAllMerchants).toHaveBeenCalledWith('user1', undefined);
			expect(result).toEqual({ data: { merchants: [samplePlace] } });
		});
	});

	describe('getMerchantById', () => {
		it('returns merchant when found', async () => {
			service.getMerchantById.mockResolvedValue(samplePlace);
			const result = await controller.getMerchantById('user1', 'p1');
			expect(service.getMerchantById).toHaveBeenCalledWith('user1', 'p1');
			expect(result).toEqual({ data: { merchant: samplePlace } });
		});

		it('returns undefined when not found', async () => {
			service.getMerchantById.mockResolvedValue(null);
			const result = await controller.getMerchantById('user1', 'p1');
			expect(result).toEqual({ data: { merchant: undefined } });
		});
	});

	describe('createMerchant', () => {
		it('delegates to service and returns id', async () => {
			service.addMerchant.mockResolvedValue({ id: 'new', name: 'Shop', category: samplePlace.category });
			const result = await controller.createMerchant('user1', 'Shop', 'cat1', 'Alias');
			expect(service.addMerchant).toHaveBeenCalledWith('user1', 'Shop', 'cat1', 'Alias');
			expect(result).toEqual({ data: { id: 'new' }, message: 'Merchant created successfully' });
		});
	});
});
