import fastify from "fastify";
import { loggerOptions } from "../utils/logger.js";

const app = fastify({
	logger: loggerOptions,
});

export default app;
