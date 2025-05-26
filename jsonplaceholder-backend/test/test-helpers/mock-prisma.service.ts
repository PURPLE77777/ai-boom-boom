import { Injectable } from '@nestjs/common';

@Injectable()
export class MockPrismaService {
  user = {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  post = {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  address = {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  };

  geo = {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  };

  company = {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  };

  async onModuleInit() {
    // Mock implementation
  }

  async onModuleDestroy() {
    // Mock implementation
  }

  async $connect() {
    // Mock implementation
  }

  async $disconnect() {
    // Mock implementation
  }

  async $transaction<T>(callback: (prisma: this) => Promise<T>): Promise<T> {
    // Execute the callback without an actual transaction
    return await callback(this);
  }

  // Helper to reset all mocks
  resetMocks(): void {
    for (const model of Object.keys(this)) {
      const modelObj = this[model as keyof this];
      if (typeof modelObj === 'object' && modelObj !== null) {
        const mockModel = modelObj as Record<string, jest.Mock>;
        for (const method of Object.keys(mockModel)) {
          const mockMethod = mockModel[method];
          if (typeof mockMethod === 'function' && mockMethod.mockReset) {
            mockMethod.mockReset();
          }
        }
      }
    }
  }
}
