import { z } from 'zod'

export const size = z.object({
  type: z.literal('VariableDeclarator'),
  init: z.union([
    z.object({
      type: z.literal('ArrayExpression'),
      elements: z
        .object({
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
        })
        .array()
        .min(1),
    }),
    z.object({
      type: z.literal('ObjectExpression'),
      properties: z
        .object({
          key: z.object({
            type: z.literal('Identifier'),
            name: z.union([z.literal('width'), z.literal('height')]),
          }),
          value: z.union([
            z.object({
              type: z.literal('Literal'),
              value: z.number(),
            }),
            z.object({
              type: z.literal('ArrayExpression'),
              elements: z
                .object({
                  type: z.literal('Literal'),
                  value: z.number(),
                })
                .array()
                .min(1),
            }),
            z.object({
              type: z.literal('ObjectExpression'),
              properties: z
                .object({
                  key: z.object({
                    type: z.literal('Identifier'),
                    name: z.union([z.literal('min'), z.literal('max')]),
                  }),
                  value: z.union([
                    z.object({
                      type: z.literal('Literal'),
                      value: z.number(),
                    }),
                    z.object({
                      type: z.literal('Identifier'),
                      name: z.literal('Infinity'),
                    }),
                  ]),
                })
                .array()
                .min(1),
            }),
          ]),
        })
        .array()
        .length(2)
        .refine(value => new Set(value.map(v => v.key.name)).size === 2),
    }),
  ]),
})
