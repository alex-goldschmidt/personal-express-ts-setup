import z from "zod";
export const UserInputSchema = z.object({
  email: z.email({ message: "Enter a valid email address" }).max(255),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .max(255),
});

export type UserInput = z.infer<typeof UserInputSchema>;
