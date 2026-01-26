import { startServer } from "./server/server";
import { shutdown } from "./server/shutdown";
import { logger } from "./utils/logger";

const main = async (): Promise<void> => {
	try {
		logger.info(`Starting Image Processing Queue Service`);
		await startServer();
	} catch (err) {
		logger.error(err, "Failed to load program");
		await shutdown();
	}
};

await main();
