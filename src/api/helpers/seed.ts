import { env } from '@/env.js';
import pkg from '@prisma/client';
import bcrypt from 'bcryptjs';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

export async function createAdminUser(): Promise<pkg.User> {
	const hashedPassword = await bcrypt.hash(env.adminPassword || '', 10);
	return await prisma.user.upsert({
		where: { email: env.adminEmail || '' },
		update: {},
		create: {
			email: env.adminEmail || '',
			name: 'Admin',
			password: hashedPassword,
			baseCurrency: 'BRL',
			role: 'ADMIN',
		},
	});
}

export async function createDefaultCategories(adminId: string): Promise<void> {
	await prisma.category.createMany({
		data: [
			{
				name: 'Restaurants',
				description: 'Spending on restaurants, bars, etc.',
				icon: 'utensils',
				userId: adminId,
				isDefault: true,
			},
			{
				name: 'Travel',
				description: 'Spending on travel, taxis, etc.',
				icon: 'plane',
				userId: adminId,
				isDefault: true,
			},
			{
				name: 'Shopping',
				description: 'Spending on shopping, clothes, etc.',
				icon: 'shopping-bag',
				userId: adminId,
				isDefault: true,
			},
			{
				name: 'Entertainment',
				description: 'Spending on entertainment, movies, etc.',
				icon: 'film',
				userId: adminId,
				isDefault: true,
			},
			{
				name: 'Supermarket',
				description: 'Spending on supermarkets, grocery stores, bakeries and convenience stores.',
				icon: 'shopping-cart',
				userId: adminId,
				isDefault: true,
			},
			{
				name: 'Clothing',
				description: 'Spending on clothes, etc.',
				icon: 'tshirt',
				userId: adminId,
				isDefault: true,
			},
			{
				name: 'Medical',
				description: 'Spending on medical, pharmacies, etc.',
				icon: 'medkit', // Or 'heartbeat', 'first-aid-kit'
				userId: adminId,
				isDefault: true,
			},
			{
				name: 'Transport',
				description: 'Spending on transport, etc.',
				icon: 'bus',
				userId: adminId,
				isDefault: true,
			},
			{
				name: 'Housing',
				description: 'Spending on housing, etc.',
				icon: 'home',
				userId: adminId,
				isDefault: true,
			},
			{
				name: 'Digital Services',
				description: 'Spending on digital services, subscriptions, etc.',
				icon: 'wifi', // 'laptop', 'cloud', 'globe'
				userId: adminId,
				isDefault: true,
			},
			{
				name: 'Hobby',
				description: 'Spending on hobbies, art, crafts, etc.',
				icon: 'palette', // 'paint-brush'
				userId: adminId,
				isDefault: true,
			},
			{
				name: 'Personal Services',
				description: 'Spending on personal services, beauty, barber, etc.',
				icon: 'user', // 'spa', 'scissors'
				userId: adminId,
				isDefault: true,
			},
			{
				name: 'Automotive',
				description: 'Spending on automotive, etc.',
				icon: 'car',
				userId: adminId,
				isDefault: true,
			},
			{
				name: 'Government',
				description: 'Spending on government, etc.',
				icon: 'landmark', // 'balance-scale', 'university'
				userId: adminId,
				isDefault: true,
			},
			{
				name: 'Insurance',
				description: 'Spending on insurance, etc.',
				icon: 'shield-alt', // 'umbrella'
				userId: adminId,
				isDefault: true,
			},
			{
				name: 'Cleaning',
				description: 'Spending on cleaning, laundry, etc.',
				icon: 'broom', // 'soap'
				userId: adminId,
				isDefault: true,
			},
			{
				name: 'Educational',
				description: 'Spending on educational, etc.',
				icon: 'graduation-cap',
				userId: adminId,
				isDefault: true,
			},
			{
				name: 'Games',
				description: 'Spending on games, etc.',
				icon: 'gamepad',
				userId: adminId,
				isDefault: true,
			},
			{
				name: 'Phone & Internet',
				description: 'Spending on phone and internet, etc.',
				icon: 'phone',
				userId: adminId,
				isDefault: true,
			},
			{
				name: 'Gifts',
				description: 'Spending on gifts, etc.',
				icon: 'gift',
				userId: adminId,
				isDefault: true,
			},
			{
				name: 'Unknown',
				description: 'Unknown spending.',
				icon: 'question-circle',
				userId: adminId,
				isDefault: true,
			},
		],
		skipDuplicates: true,
	});
}
