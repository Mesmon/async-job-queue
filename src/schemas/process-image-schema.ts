export const processImageSchema = {
  type: 'object',
  properties: {
    imageUrl: { type: 'string', format: 'uri' },
  },
  required: ['imageUrl'],
};
