import { AppError } from '@middleware/errors/errors.js';
import path from 'node:path';
import sharp from 'sharp';

export interface UploadedFile {
	buffer: Buffer;
	mimetype: string;
}

export class AvatarService {
	private readonly allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];

	constructor(
		private readonly uploadDir: string,
		private readonly baseUrl: string,
	) {}

	async saveAvatar(userId: string, file: UploadedFile): Promise<string> {
		if (!this.allowedTypes.includes(file.mimetype)) {
			throw new AppError('Invalid file type', 400);
		}
		const filename = `${userId}.webp`;
		const filePath = path.join(this.uploadDir, filename);
		try {
			await sharp(file.buffer).resize(256, 256).toFormat('webp').toFile(filePath);
		} catch (error) {
			throw new AppError('Failed to process avatar', 500, error);
		}
		return `/static/${filename}`;
		// return `${this.baseUrl}/static/${filename}`;
	}
}
