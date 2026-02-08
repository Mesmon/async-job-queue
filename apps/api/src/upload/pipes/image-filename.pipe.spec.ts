import { BadRequestException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { ImageFileNamePipe } from "./image-filename.pipe.js";

describe("ImageFileNamePipe", () => {
  const pipe = new ImageFileNamePipe();

  it("should be defined", () => {
    expect(pipe).toBeDefined();
  });

  it("should pass valid image filenames", () => {
    const validFilenames = [
      "test.jpg",
      "test.jpeg",
      "test.png",
      "test.gif",
      "test.webp",
      "TEST.JPG",
    ];
    validFilenames.forEach((filename) => {
      expect(pipe.transform({ filename })).toEqual({ filename });
    });
  });

  it("should throw BadRequestException for invalid filenames", () => {
    const invalidFilenames = ["test.txt", "test.pdf", "test", ""];
    invalidFilenames.forEach((filename) => {
      expect(() => pipe.transform({ filename })).toThrow(BadRequestException);
    });
  });

  it("should throw BadRequestException for empty object or undefined filename", () => {
    // @ts-expect-error testing runtime check
    expect(() => pipe.transform({})).toThrow(BadRequestException);
  });
});
