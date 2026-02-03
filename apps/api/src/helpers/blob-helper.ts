export const generateBlobName = (path: string): string => {
  const filename = path.split("/").pop();
  return `${Date.now()}-${filename}`;
};
