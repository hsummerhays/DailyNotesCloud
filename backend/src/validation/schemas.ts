import { z } from "zod";

const tagsSchema = z.array(z.string().trim().min(1).max(50)).max(20);

export const createNoteSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  content: z.string().max(20000).optional().default(""),
  tags: tagsSchema.optional().default([]),
});

export const updateNoteSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(255).optional(),
    content: z.string().max(20000).optional(),
    tags: tagsSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field (title, content, tags) is required",
  });

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  completed: z.boolean().optional().default(false),
});

export const updateTaskSchema = z.object({
  completed: z.boolean(),
});

export const idParamSchema = z.object({
  id: z.uuid("Invalid id"),
});
