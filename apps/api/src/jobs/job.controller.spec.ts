import { Test, type TestingModule } from "@nestjs/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { JobsController } from "./job.controller.js";
import { JobsService } from "./job.service.js";

describe("JobsController", () => {
  let controller: JobsController;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobsController],
      providers: [
        {
          provide: JobsService,
          useValue: {
            createJob: vi.fn(),
            getJobStatus: vi.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<JobsController>(JobsController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
