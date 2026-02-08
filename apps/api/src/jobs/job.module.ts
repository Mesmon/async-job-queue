import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JobsController } from "./job.controller.js";
import { JobsService } from "./job.service.js";

@Module({
  imports: [
    ConfigModule,
    BullModule.registerQueue({
      name: "image-processing",
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
      },
    }),
  ],
  controllers: [JobsController],
  providers: [JobsService],
})
export class JobsModule {}
