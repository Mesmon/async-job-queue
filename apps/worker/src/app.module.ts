import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JobsProcessor } from "./jobs/jobs.processor.js";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // Connect to Redis
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        connection: {
          host: config.get("REDIS_HOST"),
          port: config.get("REDIS_PORT"),
        },
      }),
      inject: [ConfigService],
    }),

    // Register as a Consumer (Worker)
    BullModule.registerQueue({
      name: "image-processing",
    }),
  ],
  providers: [JobsProcessor],
})
export class AppModule {}
