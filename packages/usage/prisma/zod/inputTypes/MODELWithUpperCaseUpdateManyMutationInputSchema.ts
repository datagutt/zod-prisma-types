import { z } from 'zod';
import * as PrismaClient from '@prisma/client';
import { StringFieldUpdateOperationsInputSchema } from './StringFieldUpdateOperationsInputSchema';
import { MYValueSchema } from './MYValueSchema';
import { EnumMYValueFieldUpdateOperationsInputSchema } from './EnumMYValueFieldUpdateOperationsInputSchema';

export const MODELWithUpperCaseUpdateManyMutationInputSchema: z.ZodType<PrismaClient.Prisma.MODELWithUpperCaseUpdateManyMutationInput> = z.object({
  STRING: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  MYValue: z.union([ z.lazy(() => MYValueSchema),z.lazy(() => EnumMYValueFieldUpdateOperationsInputSchema) ]).optional(),
}).strict()