import { BadRequestException, PipeTransform } from "@nestjs/common";
import type { ZodType } from "zod";

/**
 * NestJS's built-in ValidationPipe expects class-validator decorators; the
 * architecture standardizes on zod (packages/validation) instead, so DTOs
 * stay plain data shapes shared with web/admin/mobile rather than
 * Nest-specific classes.
 */
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodType) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        error: {
          code: "VALIDATION_ERROR",
          message: "Request payload failed validation",
          details: result.error.flatten(),
        },
      });
    }
    return result.data;
  }
}
