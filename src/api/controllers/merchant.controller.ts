import type { MerchantCreateResponse, MerchantResponse, MerchantsListResponse } from '@schemas/merchant.schema.js';
import type { SortOrder } from '@schemas/common.schema.js';
import type { MerchantService } from '@services/merchant.service.js';

export class MerchantController {
	constructor(private readonly merchantService: MerchantService) {}

        public async getAllMerchants(userId: string, order?: SortOrder): Promise<MerchantsListResponse> {
                const merchants = await this.merchantService.getAllMerchants(userId, order);
		return {
			data: {
				merchants,
			},
		};
	}

	public async getMerchantById(userId: string, id: string): Promise<MerchantResponse> {
		const merchant = await this.merchantService.getMerchantById(userId, id);
		return {
			data: {
				merchant: merchant ?? undefined,
			},
		};
	}

	public async createMerchant(
		userId: string,
		name: string,
		categoryId: string,
		customName?: string | null,
	): Promise<MerchantCreateResponse> {
		const merchant = await this.merchantService.addMerchant(userId, name, categoryId, customName);
		const { id } = merchant;
		return {
			data: { id },
			message: 'Merchant created successfully',
		};
	}
}
