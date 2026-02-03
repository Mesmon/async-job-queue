import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module.js";
import { ZodFilter } from "./filters/zod.filter.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalFilters(new ZodFilter());
  await app.listen(3000);
}

void bootstrap();
