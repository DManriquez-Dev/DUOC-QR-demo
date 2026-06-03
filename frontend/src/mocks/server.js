import { setupServer } from 'msw/node'
import { handlers } from './handlers'

/**
 * Servidor MSW para el entorno Node (Vitest).
 * Se arranca/para en los hooks beforeAll / afterAll del suite de tests.
 */
export const server = setupServer(...handlers)