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
      post: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
    })),
  };
});

describe('PostsController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let jwtToken: string;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    username: 'testuser',
    name: 'Test User',
  };

  const mockPost = {
    id: 1,
    title: 'Test Post',
    body: 'This is a test post body',
    userId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: mockUser,
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        post: {
          findUnique: jest.fn(),
          findMany: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
        },
        user: {
          findUnique: jest.fn(),
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

    // Mock user finding for JWT validation
    (prismaService.user.findUnique as jest.Mock).mockImplementation(
      (params: { where: { id?: number; email?: string } }) => {
        if (params?.where?.id === mockUser.id) {
          return Promise.resolve(mockUser);
        }
        return Promise.resolve(null);
      }
    );

    // Mock post finding for tests
    (prismaService.post.findUnique as jest.Mock).mockImplementation(
      (params: { where: { id: number } }) => {
        if (params?.where?.id === mockPost.id) {
          return Promise.resolve(mockPost);
        }
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

  describe('/posts (POST)', () => {
    it('should create a new post', async () => {
      const createPostDto = {
        title: 'New Post',
        body: 'This is a new post body',
      };

      // Mock the user.findUnique method to return a user
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      // Mock the post.create method to return the new post
      (prismaService.post.create as jest.Mock).mockResolvedValue({
        id: 2,
        ...createPostDto,
        userId: mockUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: mockUser,
      });

      return request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(createPostDto)
        .expect(201)
        .expect(res => {
          const responseBody = res.body as Record<string, any>;
          expect(responseBody).toHaveProperty('id', 2);
          expect(responseBody).toHaveProperty('title', createPostDto.title);
          expect(responseBody).toHaveProperty('body', createPostDto.body);
          expect(responseBody).toHaveProperty('userId', mockUser.id);
        });
    });

    it('should return 401 when not authenticated', async () => {
      return request(app.getHttpServer())
        .post('/posts')
        .send({ title: 'Test Post', body: 'Test Body' })
        .expect(401);
    });
  });

  describe('/posts (GET)', () => {
    it('should return all posts', async () => {
      const mockPosts = [
        mockPost,
        {
          id: 2,
          title: 'Post 2',
          body: 'Body 2',
          userId: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            id: 2,
            name: 'User 2',
            email: 'user2@example.com',
          },
        },
      ];

      // Mock the findMany method to return posts
      (prismaService.post.findMany as jest.Mock).mockResolvedValue(mockPosts);

      return request(app.getHttpServer())
        .get('/posts')
        .expect(200)
        .expect(res => {
          const responseBody = res.body as any[];
          expect(Array.isArray(responseBody)).toBe(true);
          expect(responseBody).toHaveLength(2);
          expect(responseBody[0]).toHaveProperty('id', mockPosts[0].id);
          expect(responseBody[1]).toHaveProperty('id', mockPosts[1].id);
        });
    });
  });

  describe('/posts/:id (GET)', () => {
    it('should return a post by ID', async () => {
      // Mock the findUnique method to return a post
      (prismaService.post.findUnique as jest.Mock).mockResolvedValue(mockPost);

      return request(app.getHttpServer())
        .get('/posts/1')
        .expect(200)
        .expect(res => {
          const responseBody = res.body as Record<string, any>;
          expect(responseBody).toHaveProperty('id', mockPost.id);
          expect(responseBody).toHaveProperty('title', mockPost.title);
          expect(responseBody).toHaveProperty('body', mockPost.body);
          expect(responseBody).toHaveProperty('userId', mockPost.userId);
        });
    });

    it('should return 404 when post not found', async () => {
      // Mock the findUnique method to return null
      (prismaService.post.findUnique as jest.Mock).mockResolvedValue(null);

      return request(app.getHttpServer()).get('/posts/999').expect(404);
    });
  });

  describe('/posts/:id (PATCH)', () => {
    it('should update a post', async () => {
      const updatePostDto = {
        title: 'Updated Post',
        body: 'This is an updated post body',
      };

      // Mock the findUnique method to return a post
      (prismaService.post.findUnique as jest.Mock).mockResolvedValue(mockPost);

      // Mock the update method to return the updated post
      (prismaService.post.update as jest.Mock).mockResolvedValue({
        ...mockPost,
        ...updatePostDto,
      });

      return request(app.getHttpServer())
        .patch('/posts/1')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(updatePostDto)
        .expect(200)
        .expect(res => {
          const responseBody = res.body as Record<string, any>;
          expect(responseBody).toHaveProperty('id', mockPost.id);
          expect(responseBody).toHaveProperty('title', updatePostDto.title);
          expect(responseBody).toHaveProperty('body', updatePostDto.body);
        });
    });

    it('should return 404 when post not found', async () => {
      // Mock the findUnique method to return null
      (prismaService.post.findUnique as jest.Mock).mockResolvedValue(null);

      return request(app.getHttpServer())
        .patch('/posts/999')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({ title: 'Updated Post' })
        .expect(404);
    });

    it('should return 401 when not authenticated', async () => {
      return request(app.getHttpServer())
        .patch('/posts/1')
        .send({ title: 'Updated Post' })
        .expect(401);
    });
  });

  describe('/posts/:id (DELETE)', () => {
    it('should delete a post', async () => {
      // Mock the findUnique method to return a post
      (prismaService.post.findUnique as jest.Mock).mockResolvedValue(mockPost);

      // Mock the delete method
      (prismaService.post.delete as jest.Mock).mockResolvedValue(undefined);

      return request(app.getHttpServer())
        .delete('/posts/1')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(204);
    });

    it('should return 404 when post not found', async () => {
      // Mock the findUnique method to return null
      (prismaService.post.findUnique as jest.Mock).mockResolvedValue(null);

      return request(app.getHttpServer())
        .delete('/posts/999')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(404);
    });

    it('should return 401 when not authenticated', async () => {
      return request(app.getHttpServer()).delete('/posts/1').expect(401);
    });
  });

  describe('/posts/user/:userId (GET)', () => {
    it('should return posts by user ID', async () => {
      const userPosts = [
        mockPost,
        {
          id: 2,
          title: 'Post 2',
          body: 'Body 2',
          userId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: mockUser,
        },
      ];

      // Mock the findMany method to return posts for a user
      (prismaService.post.findMany as jest.Mock).mockResolvedValue(userPosts);

      return request(app.getHttpServer())
        .get('/posts/user/1')
        .expect(200)
        .expect(res => {
          const responseBody = res.body as any[];
          expect(Array.isArray(responseBody)).toBe(true);
          expect(responseBody).toHaveLength(2);
          expect(responseBody[0]).toHaveProperty('id', userPosts[0].id);
          expect(responseBody[1]).toHaveProperty('id', userPosts[1].id);
          expect(responseBody[0]).toHaveProperty('userId', 1);
          expect(responseBody[1]).toHaveProperty('userId', 1);
        });
    });

    it('should return empty array when no posts found for user', async () => {
      // Mock the findMany method to return empty array
      (prismaService.post.findMany as jest.Mock).mockResolvedValue([]);

      return request(app.getHttpServer())
        .get('/posts/user/999')
        .expect(200)
        .expect(res => {
          const responseBody = res.body as any[];
          expect(Array.isArray(responseBody)).toBe(true);
          expect(responseBody).toHaveLength(0);
        });
    });
  });
});
