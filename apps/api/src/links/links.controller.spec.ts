import { Test, type TestingModule } from "@nestjs/testing";
import { beforeEach, describe, expect, it } from "vitest";

import { LinksController } from "./links.controller";
import { LinksService } from "./links.service";

describe("LinksController", () => {
  let controller: LinksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LinksController],
      providers: [LinksService],
    }).compile();

    controller = module.get<LinksController>(LinksController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
