import { Controller, Get, Param, Query } from "@nestjs/common";
import { serviceListQuerySchema, slugParamSchema, type ServiceListQuery } from "@2blog/validation";
import type { ApiSuccess, CursorPage, Service } from "@2blog/types";
import { ZodValidationPipe } from "../../core/common/zod-validation.pipe";
import { ServicesService } from "./services.service";

@Controller("services/public")
export class ServicesPublicController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  async list(@Query(new ZodValidationPipe(serviceListQuerySchema)) query: ServiceListQuery): Promise<ApiSuccess<CursorPage<Service>>> {
    return { data: await this.servicesService.listPublic(query) };
  }

  @Get(":slug")
  async findBySlug(@Param(new ZodValidationPipe(slugParamSchema)) params: { slug: string }): Promise<ApiSuccess<Service>> {
    return { data: await this.servicesService.findPublicBySlug(params.slug) };
  }
}
