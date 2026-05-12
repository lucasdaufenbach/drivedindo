import { z } from 'zod'

export const startTripSchema = z.object({
  vehicleId: z.string().uuid('Veículo inválido'),
  kmStart: z
    .number({ invalid_type_error: 'KM inicial deve ser um número' })
    .positive('KM inicial deve ser maior que zero')
    .max(9999999, 'KM inválido'),
  notes: z.string().max(500).optional(),
})

export const endTripSchema = z.object({
  kmEnd: z
    .number({ invalid_type_error: 'KM final deve ser um número' })
    .positive('KM final deve ser maior que zero')
    .max(9999999, 'KM inválido'),
  notes: z.string().max(500).optional(),
})

export const addExpenseSchema = z.object({
  vehicleId: z.string().uuid(),
  categoryId: z.string().uuid('Selecione uma categoria'),
  amount: z
    .number({ invalid_type_error: 'Valor deve ser um número' })
    .positive('Valor deve ser maior que zero')
    .max(999999.99, 'Valor muito alto'),
  description: z.string().max(500).optional(),
  expenseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  paidBy: z.string().uuid('Selecione quem pagou'),
})

export const signInSchema = z.object({
  email: z.string().email('E-mail inválido').toLowerCase(),
  password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
})

export const signUpSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Nome deve ter ao menos 2 caracteres')
    .max(100, 'Nome muito longo'),
  email: z.string().email('E-mail inválido').toLowerCase(),
  password: z
    .string()
    .min(8, 'Senha deve ter ao menos 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve ter ao menos uma letra maiúscula')
    .regex(/[0-9]/, 'Senha deve ter ao menos um número'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
})

export const createVehicleSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres').max(100),
  plate: z
    .string()
    .min(7, 'Placa inválida')
    .max(8, 'Placa inválida')
    .toUpperCase(),
  model: z.string().max(100).optional(),
  year: z
    .number()
    .int()
    .min(1950)
    .max(new Date().getFullYear() + 1)
    .optional(),
  color: z.string().max(50).optional(),
  currentKm: z
    .number()
    .nonnegative('KM não pode ser negativo')
    .max(9999999)
    .default(0),
})

export type StartTripInput = z.infer<typeof startTripSchema>
export type EndTripInput = z.infer<typeof endTripSchema>
export type AddExpenseInput = z.infer<typeof addExpenseSchema>
export type SignInInput = z.infer<typeof signInSchema>
export type SignUpInput = z.infer<typeof signUpSchema>
export type CreateVehicleInput = z.infer<typeof createVehicleSchema>
