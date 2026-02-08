import { describe, expect, it, vi } from "vitest";
import { generateBlobName } from "./blob-helper.js";

describe("BlobHelper", () => {
  describe("generateBlobName", () => {
    it("should generate a blob name with timestamp", () => {
      const mockDate = new Date(2023, 0, 1).getTime();
      vi.setSystemTime(mockDate);

      const filename = "test-image.png";
      const result = generateBlobName(filename);

      expect(result).toBe(`${mockDate}-${filename}`);

      vi.useRealTimers();
    });

    it("should handle paths with directories", () => {
      const mockDate = new Date(2023, 0, 1).getTime();
      vi.setSystemTime(mockDate);

      const path = "path/to/my/image.jpg";
      const result = generateBlobName(path);

      expect(result).toBe(`${mockDate}-image.jpg`);

      vi.useRealTimers();
    });
  });
});
