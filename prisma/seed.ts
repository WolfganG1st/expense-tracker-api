import { createAdminUser, createDefaultCategories } from '../src/api/helpers/seed.js';

async function main() {
	const admin = await createAdminUser();

	await createDefaultCategories(admin.id);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
