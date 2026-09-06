import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { ZodSchema } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(
    private readonly schema: ZodSchema,
    private readonly target?: () => string,
  ) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    if (this.target) {
      const target = this.target();
      if (target !== metadata.type && target !== 'all') {
        return value;
      }
    }
    return this.schema.parse(value);
  }
}
