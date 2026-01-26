import fastify from "fastify";
import { loggerOptions } from "../utils/logger.js";
import imageRouter from "../routes/image-routes.js";

const app = fastify({
	logger: loggerOptions,
});

app.register(imageRouter);

export default app;
