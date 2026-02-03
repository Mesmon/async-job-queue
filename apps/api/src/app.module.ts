import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AppController } from "./app.controller.js";
import { AppService } from "./app.service.js";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        connection: {
          host: config.getOrThrow<string>("REDIS_HOST"),
          port: config.getOrThrow<number>("REDIS_PORT"),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: "image-processing",
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
