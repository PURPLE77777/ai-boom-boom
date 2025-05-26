import { Module } from '@nestjs/common';
import { MockPrismaService } from './mock-prisma.service';

@Module({
  providers: [
    {
      provide: 'PrismaService',
      useClass: MockPrismaService,
    },
  ],
  exports: ['PrismaService'],
})
export class MockPrismaModule {}
