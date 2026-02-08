import { type ArgumentsHost, HttpStatus } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { ZodError, type z } from "zod";
import { ZodFilter } from "./zod.filter.js";

describe("ZodFilter", () => {
  it("should be defined", () => {
    expect(new ZodFilter()).toBeDefined();
  });

  it("should catch ZodError and format response", () => {
    const filter = new ZodFilter();
    const mockJson = vi.fn();
    const mockStatus = vi.fn().mockReturnValue({ json: mockJson });
    const mockGetResponse = vi.fn().mockReturnValue({ status: mockStatus });
    const mockHost = {
      switchToHttp: () => ({
        getResponse: mockGetResponse,
      }),
    } as unknown as ArgumentsHost;

    const zodIssues = [
      {
        code: "invalid_type",
        expected: "string",
        received: "number",
        path: ["username"],
        message: "Expected string, received number",
      },
    ] as unknown as z.core.$ZodIssue[];
    const exception = new ZodError(zodIssues);

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockJson).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      message: "Validation failed",
      errors: [
        {
          field: "username",
          message: "Expected string, received number",
          code: "invalid_type",
        },
      ],
    });
  });
});
