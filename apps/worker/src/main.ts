import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ["error", "warn", "log", "debug", "verbose"],
  });
  app.enableCors();

  const configService = app.get(ConfigService);
  const port = configService.get<number>("PORT") || 3000;

  await app.listen(port);
}

void bootstrap();
