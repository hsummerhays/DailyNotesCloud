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

const emailSchema = z.string().trim().max(255).pipe(z.email("Invalid email address"));

export const signupSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
  displayName: z.string().trim().min(1, "Display name is required").max(100),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const googleAuthSchema = z.object({
  credential: z.string().min(1, "Google credential token is required"),
});
