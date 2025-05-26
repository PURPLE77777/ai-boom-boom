import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

// Mock the PrismaService to avoid connecting to the database
jest.mock('../src/prisma/prisma.service', () => {
  return {
    PrismaService: jest.fn().mockImplementation(() => ({
      onModuleInit: jest.fn(),
      onModuleDestroy: jest.fn(),
      $connect: jest.fn(),
      $disconnect: jest.fn(),
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
      },
    })),
  };
});

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    username: 'testuser',
    name: 'Test User',
    password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', // 'password123'
    phone: '123-456-7890',
    website: 'example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        user: {
          findUnique: jest.fn(),
          findFirst: jest.fn(),
          create: jest.fn(),
        },
        onModuleInit: jest.fn(),
        onModuleDestroy: jest.fn(),
        $connect: jest.fn(),
        $disconnect: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());

    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    // Mock the findUnique method to return the user for JWT validation if needed
    (prismaService.user.findUnique as jest.Mock).mockImplementation(
      (params: { where: { id?: number; email?: string } }) => {
        if (
          params?.where?.id === mockUser.id ||
          params?.where?.email === mockUser.email
        ) {
          return Promise.resolve(mockUser);
        }
        return Promise.resolve(null);
      }
    );

    await app.init();
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  describe('/auth/login (POST)', () => {
    it('should return JWT token when credentials are valid', async () => {
      // Mock the findUnique method to return the user
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      // Mock bcrypt compare
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => true);

      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'password123' })
        .expect(200)
        .expect(res => {
          const responseBody = res.body as { accessToken: string; user: any };
          expect(responseBody).toHaveProperty('accessToken');
          expect(responseBody).toHaveProperty('user');
          expect(responseBody.user).toHaveProperty('id', mockUser.id);
          expect(responseBody.user).toHaveProperty('email', mockUser.email);
          expect(responseBody.user).not.toHaveProperty('password');
        });
    });

    it('should return 401 when credentials are invalid', async () => {
      // Mock the findUnique method to return the user
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      // Mock bcrypt compare to return false
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => false);

      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'wrongpassword' })
        .expect(401);
    });

    it('should return 401 when user does not exist', async () => {
      // Mock the findUnique method to return null
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'password123' })
        .expect(401);
    });

    it('should return 400 when email is invalid', async () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'invalid-email', password: 'password123' })
        .expect(400);
    });

    it('should return 400 when password is too short', async () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@example.com', password: '12345' })
        .expect(400);
    });
  });
});
