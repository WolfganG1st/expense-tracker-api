import sharp from 'sharp';
import { AppError } from '../middleware/errors/errors.js';
import { AvatarService, type UploadedFile } from './avatar.service.js';
import { fromPartial } from '@total-typescript/shoehorn';

jest.mock('sharp', () => {
	return jest.fn(() => ({
		resize: jest.fn().mockReturnThis(),
		toFormat: jest.fn().mockReturnThis(),
		toFile: jest.fn().mockResolvedValue(undefined),
	}));
});

describe('AvatarService', () => {
	let service: AvatarService;

	beforeEach(() => {
		service = new AvatarService('/tmp', 'http://localhost');
	});

        it('processes and saves avatar', async () => {
                const file = fromPartial<UploadedFile>({
                        buffer: Buffer.from('img'),
                        mimetype: 'image/png',
                });
		const url = await service.saveAvatar('user', file);
		expect(sharp).toHaveBeenCalledWith(file.buffer);
		expect(url).toBe('/static/user.webp');
	});

        it('throws on invalid type', async () => {
                const file = fromPartial<UploadedFile>({
                        buffer: Buffer.from('bad'),
                        mimetype: 'text/plain',
                });
		await expect(service.saveAvatar('user', file)).rejects.toThrow(AppError);
	});
});
