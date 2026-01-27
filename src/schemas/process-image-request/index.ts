import { bodySchema } from './body-schema';
import { errorResponseSchema } from './error-response-schema';
import { successResponseSchema } from './success-response-schema';

export const processImageRequestSchemas = {
  body: bodySchema,
  202: successResponseSchema,
  400: errorResponseSchema,
};
