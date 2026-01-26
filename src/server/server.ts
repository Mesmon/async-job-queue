import { config } from "../config.js";
import { logger } from "../utils/logger.js";
import app from "./app.js";

export const startServer = async () => {
	try {
		const { port } = config;
		await app.listen({ host: "0.0.0.0", port });
	} catch (error) {
		throw new Error("Failed to start server", { cause: error });
	}
};

export const closeServer = async () => {
	try {
		await app.close();
		logger.info("Server is closed");
	} catch (error) {
		throw new Error("Failed to close server", { cause: error });
	}
};
