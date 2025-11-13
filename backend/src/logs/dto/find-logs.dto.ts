import {
  IsOptional,
  IsEnum,
  IsString,
  IsDateString,
  IsInt,
  Min,
  IsArray,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { LogAction } from '@prisma/client';

export class FindLogsDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsEnum(LogAction)
  action?: LogAction;

  @IsOptional()
  @IsString()
  entity?: string;

  @Transform(({ value }) => {
    if (!value) return undefined;
    if (typeof value === 'string') {
      const result = value
        .split(',')
        .map((v) => v.trim())
        .filter((v) => v);
      return result.length > 0 ? result : undefined;
    }
    if (Array.isArray(value)) {
      const filtered = value.filter((v) => v && typeof v === 'string');
      return filtered.length > 0 ? filtered : undefined;
    }
    return undefined;
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  entities?: string[];

  @IsOptional()
  @IsString()
  entityId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
