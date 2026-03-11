import { z } from 'zod';
import { PARAM_DESCRIPTIONS } from './description-builders';

export const searchToolSchema = z.object({
  query: z.string().min(1).describe(PARAM_DESCRIPTIONS.query),
  categories: z.string().optional().describe(PARAM_DESCRIPTIONS.categories),
  language: z.string().optional().describe(PARAM_DESCRIPTIONS.language),
  time_range: z.enum(['day', 'month', 'year']).optional().describe(PARAM_DESCRIPTIONS.time_range),
  safesearch: z.enum(['0', '1', '2']).optional().describe(PARAM_DESCRIPTIONS.safesearch),
  pageno: z.number().int().min(1).optional().describe(PARAM_DESCRIPTIONS.pageno),
  engines: z.string().optional().describe(PARAM_DESCRIPTIONS.engines),
});

export type SearchToolInput = z.infer<typeof searchToolSchema>;
