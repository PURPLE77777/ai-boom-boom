import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

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
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      address: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      geo: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      company: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    })),
  };
});

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let jwtToken: string;

  const mockUser = {
    id: 1,
    name: 'Test User',
    username: 'testuser',
    email: 'test@example.com',
    password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', // 'password123'
    phone: '123-456-7890',
    website: 'example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
    address: {
      id: 1,
      street: '123 Test St',
      suite: 'Suite 100',
      city: 'Testville',
      zipcode: '12345',
      userId: 1,
      geo: {
        id: 1,
        lat: '40.7128',
        lng: '-74.0060',
        addressId: 1,
      },
    },
    company: {
      id: 1,
      name: 'Test Company',
      catchPhrase: 'Testing is fun',
      bs: 'Test business',
      userId: 1,
    },
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
          findMany: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
        },
        address: {
          create: jest.fn(),
          findUnique: jest.fn(),
          update: jest.fn(),
        },
        geo: {
          create: jest.fn(),
          findUnique: jest.fn(),
          update: jest.fn(),
        },
        company: {
          create: jest.fn(),
          findUnique: jest.fn(),
          update: jest.fn(),
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
    jwtService = moduleFixture.get<JwtService>(JwtService);

    // Mock user finding for JWT validation and tests
    (prismaService.user.findUnique as jest.Mock).mockImplementation(
      (params: { where: { id?: number; email?: string } }) => {
        // For JWT auth validation
        if (params?.where?.id === mockUser.id) {
          return Promise.resolve(mockUser);
        }

        // For test cases that expect specific user IDs
        // This is needed because of different behavior between auth check and actual endpoint logic
        if (params.where.id === 999) {
          // Special case for our 404 tests
          return Promise.resolve(null);
        }

        // Default behavior for other IDs (could be null or mockUser depending on test needs)
        return Promise.resolve(null);
      }
    );

    // Create a JWT token with proper format for authentication
    jwtToken = jwtService.sign(
      {
        sub: mockUser.id,
        email: mockUser.email,
      },
      { secret: process.env.JWT_SECRET || 'test-secret-key' }
    );

    await app.init();
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  describe('/users (POST)', () => {
    it('should create a new user', async () => {
      const createUserDto = {
        name: 'New User',
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
        phone: '123-456-7890',
        website: 'example.com',
        address: {
          street: '123 Test St',
          suite: 'Suite 100',
          city: 'Testville',
          zipcode: '12345',
          geo: {
            lat: '40.7128',
            lng: '-74.0060',
          },
        },
        company: {
          name: 'Test Company',
          catchPhrase: 'Testing is fun',
          bs: 'Test business',
        },
      };

      // Mock the findFirst method to ensure no existing user
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(null);

      // Mock the create method to return the new user
      (prismaService.user.create as jest.Mock).mockResolvedValue({
        id: 2,
        ...createUserDto,
        password: 'hashedPassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return request(app.getHttpServer())
        .post('/users')
        .send(createUserDto)
        .expect(201)
        .expect(res => {
          const responseBody = res.body as Record<string, any>;
          expect(responseBody).toHaveProperty('id', 2);
          expect(responseBody).toHaveProperty('name', createUserDto.name);
          expect(responseBody).toHaveProperty('email', createUserDto.email);
          expect(responseBody).not.toHaveProperty('password');
        });
    });

    it('should return 409 when user already exists', async () => {
      const createUserDto = {
        name: 'Existing User',
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'password123',
      };

      // Mock the findFirst method to return an existing user
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue({
        id: 3,
        email: createUserDto.email,
      });

      return request(app.getHttpServer())
        .post('/users')
        .send(createUserDto)
        .expect(409);
    });
  });

  describe('/users (GET)', () => {
    it('should return all users', async () => {
      const mockUsers = [
        { ...mockUser, password: undefined },
        {
          id: 2,
          name: 'User 2',
          username: 'user2',
          email: 'user2@example.com',
          phone: '123-456-7891',
          website: 'example2.com',
          createdAt: new Date(),
          updatedAt: new Date(),
          address: {
            id: 2,
            street: '456 Test St',
            suite: 'Suite 200',
            city: 'Testopolis',
            zipcode: '54321',
            userId: 2,
            geo: {
              id: 2,
              lat: '41.7128',
              lng: '-75.0060',
              addressId: 2,
            },
          },
          company: {
            id: 2,
            name: 'Company 2',
            catchPhrase: 'Catchphrase 2',
            bs: 'BS 2',
            userId: 2,
          },
        },
      ];

      // Mock the findMany method to return users
      (prismaService.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200)
        .expect(res => {
          const responseBody = res.body as any[];
          expect(Array.isArray(responseBody)).toBe(true);
          expect(responseBody).toHaveLength(2);
          expect(responseBody[0]).toHaveProperty('id', mockUsers[0].id);
          expect(responseBody[1]).toHaveProperty('id', mockUsers[1].id);
          expect(responseBody[0]).not.toHaveProperty('password');
          expect(responseBody[1]).not.toHaveProperty('password');
        });
    });

    it('should return 401 when not authenticated', async () => {
      return request(app.getHttpServer()).get('/users').expect(401);
    });
  });

  describe('/users/:id (GET)', () => {
    it('should return a user by ID', async () => {
      // Mock the findUnique method to return a user
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        password: undefined,
      });

      return request(app.getHttpServer())
        .get('/users/1')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200)
        .expect(res => {
          const responseBody = res.body as Record<string, any>;
          expect(responseBody).toHaveProperty('id', mockUser.id);
          expect(responseBody).toHaveProperty('name', mockUser.name);
          expect(responseBody).toHaveProperty('email', mockUser.email);
          expect(responseBody).not.toHaveProperty('password');
        });
    });

    it('should return 401 when trying to access non-existent user', async () => {
      // Mock the findUnique method to return null
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      return request(app.getHttpServer())
        .get('/users/999')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(401);
    });

    it('should return 401 when not authenticated', async () => {
      return request(app.getHttpServer()).get('/users/1').expect(401);
    });
  });

  describe('/users/:id (PATCH)', () => {
    it('should update a user', async () => {
      const updateUserDto = {
        name: 'Updated User',
        email: 'updated@example.com',
      };

      // Mock the findUnique method to return a user
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      // Mock the update method to return the updated user
      (prismaService.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        ...updateUserDto,
      });

      return request(app.getHttpServer())
        .patch('/users/1')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(updateUserDto)
        .expect(200)
        .expect(res => {
          const responseBody = res.body as Record<string, any>;
          expect(responseBody).toHaveProperty('id', mockUser.id);
          expect(responseBody).toHaveProperty('name', updateUserDto.name);
          expect(responseBody).toHaveProperty('email', updateUserDto.email);
        });
    });

    it('should return 401 when trying to update non-existent user', async () => {
      // Mock the findUnique method to return null
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      return request(app.getHttpServer())
        .patch('/users/999')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({ name: 'Updated User' })
        .expect(401);
    });
  });

  describe('/users/:id (DELETE)', () => {
    it('should delete a user', async () => {
      // Mock the findUnique method to return a user
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      // Mock the delete method to return the deleted user
      (prismaService.user.delete as jest.Mock).mockResolvedValue(mockUser);

      return request(app.getHttpServer())
        .delete('/users/1')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(204);
    });

    it('should return 401 when trying to delete non-existent user', async () => {
      // Mock the findUnique method to return null
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      return request(app.getHttpServer())
        .delete('/users/999')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(401);
    });
  });
});
