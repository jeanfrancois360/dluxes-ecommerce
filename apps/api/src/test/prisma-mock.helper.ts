/**
 * Prisma Mock Helper
 *
 * Provides properly typed mock functions for Prisma service in tests
 */

export type MockedPrismaService = {
  user: {
    findUnique: jest.Mock;
    findMany: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    updateMany: jest.Mock;
    delete: jest.Mock;
    deleteMany: jest.Mock;
  };
  store: {
    create: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
  };
  loginAttempt: {
    findMany: jest.Mock;
    create: jest.Mock;
  };
  passwordReset: {
    create: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
  };
  userSession: {
    create: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    updateMany: jest.Mock;
  };
  emailVerification: {
    create: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
  };
};

/**
 * Creates a properly typed mock PrismaService for testing
 */
export const createMockPrismaService = (): MockedPrismaService => ({
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  store: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  loginAttempt: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  passwordReset: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  userSession: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  emailVerification: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
});
