import type { FastifyInstance } from "fastify";
import { processImageHandler } from "../controllers/image-controller";
import { processImageSchema } from "../schemas/process-image-schema";

const processImage = async (fastify: FastifyInstance) => {
	fastify.post(
		"/process-image",
		{
			schema: {
				body: processImageSchema,
				response: {
					202: {
						type: "object",
						properties: {
							status: { type: "string" },
							jobId: { type: "string" },
							info: { type: "string" },
						},
					},
					400: {
						type: "object",
						properties: {
							error: { type: "string" },
						},
					},
				},
				tags: ["Images"],
			},
		},
		processImageHandler,
	);
};

const imageRouter = async (fastify: FastifyInstance) => {
	await processImage(fastify);
};

export default imageRouter;
