/**
 * Starts the server on the configured port
 */
async function startServer(): Promise<void> {
	const { buildServer } = await import('@api/server.js');
	const server = await buildServer();

	const { port, host } = server.serverConfig;
	await server.listen({ port, host });
}

startServer().catch((err) => {
	console.error('Error starting server:', err);
	process.exit(1);
});
