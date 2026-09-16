import { Controller, Get } from "@nestjs/common";
import type { ApiSuccess } from "@2blog/types";

interface HealthStatus {
  status: "ok";
  timestamp: string;
}

@Controller("health")
export class HealthController {
  @Get()
  check(): ApiSuccess<HealthStatus> {
    return {
      data: {
        status: "ok",
        timestamp: new Date().toISOString(),
      },
    };
  }
}
