import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MockPrismaService } from './mock-prisma.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuthModule } from '../../src/auth/auth.module';
import { UsersModule } from '../../src/users/users.module';
import { PostsModule } from '../../src/posts/posts.module';

@Module({
  imports: [
    JwtModule.register({
      secret: 'test-secret-key',
      signOptions: { expiresIn: '1h' },
    }),
    AuthModule,
    UsersModule,
    PostsModule,
  ],
  providers: [
    {
      provide: PrismaService,
      useClass: MockPrismaService,
    },
  ],
  exports: [JwtModule, PrismaService],
})
export class TestAppModule {}
