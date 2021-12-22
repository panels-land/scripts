import { z } from 'zod'

export const size = z.object({
  type: z.literal('VariableDeclarator'),
  init: z.object({
    type: z.literal('ObjectExpression'),
    properties: z
      .object({
        kind: z.literal('init'),
        key: z.object({
          type: z.literal('Identifier'),
          name: z.union([z.literal('width'), z.literal('height')]),
        }),
        value: z.object({
          type: z.literal('Literal'),
          value: z.number(),
        }),
      })
      .array()
      .length(2)
      .refine(value => new Set(value.map(v => v.key.name)).size === 2),
  }),
})
