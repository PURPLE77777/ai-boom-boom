import { Test, TestingModule } from '@nestjs/testing';
import { PostsService } from './posts.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('PostsService', () => {
  let service: PostsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    post: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createPostDto = {
      title: 'Test Post',
      body: 'This is a test post body',
      userId: 1,
    };

    const mockUser = {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
    };

    const mockCreatedPost = {
      id: 1,
      ...createPostDto,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: mockUser,
    };

    it('should create a post when userId is provided in DTO', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.post.create.mockResolvedValue(mockCreatedPost);

      const result = await service.create(createPostDto);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: { id: true },
      });
      expect(mockPrismaService.post.create).toHaveBeenCalledWith({
        data: createPostDto,
        include: {
          user: true,
        },
      });
      expect(result).toEqual(mockCreatedPost);
    });

    it('should create a post when userId is provided via token', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.post.create.mockResolvedValue(mockCreatedPost);

      const dtoWithoutUserId = {
        title: createPostDto.title,
        body: createPostDto.body,
      };
      const result = await service.create(dtoWithoutUserId, 1);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: { id: true },
      });
      expect(mockPrismaService.post.create).toHaveBeenCalledWith({
        data: {
          ...dtoWithoutUserId,
          userId: 1,
        },
        include: {
          user: true,
        },
      });
      expect(result).toEqual(mockCreatedPost);
    });

    it('should throw Error if no userId is provided', async () => {
      const dtoWithoutUserId = {
        title: createPostDto.title,
        body: createPostDto.body,
      };

      await expect(service.create(dtoWithoutUserId)).rejects.toThrow(
        'User ID is required'
      );
      expect(mockPrismaService.user.findUnique).not.toHaveBeenCalled();
      expect(mockPrismaService.post.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.create(createPostDto)).rejects.toThrow(
        NotFoundException
      );
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: { id: true },
      });
      expect(mockPrismaService.post.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    const mockPosts = [
      {
        id: 1,
        title: 'Post 1',
        body: 'Body 1',
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 1,
          name: 'User 1',
          email: 'user1@example.com',
        },
      },
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

    it('should return all posts', async () => {
      mockPrismaService.post.findMany.mockResolvedValue(mockPosts);

      const result = await service.findAll();

      expect(mockPrismaService.post.findMany).toHaveBeenCalledWith({
        include: {
          user: true,
        },
      });
      expect(result).toEqual(mockPosts);
      expect(result).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    const mockPost = {
      id: 1,
      title: 'Test Post',
      body: 'This is a test post body',
      userId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
      },
    };

    it('should return a post by ID', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);

      const result = await service.findOne(1);

      expect(mockPrismaService.post.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          user: true,
        },
      });
      expect(result).toEqual(mockPost);
    });

    it('should throw NotFoundException if post not found', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.post.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
        include: {
          user: true,
        },
      });
    });
  });

  describe('update', () => {
    const updatePostDto = {
      title: 'Updated Test Post',
      body: 'This is an updated test post body',
    };

    const mockPost = {
      id: 1,
      title: 'Test Post',
      body: 'This is a test post body',
      userId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
      },
    };

    const mockUpdatedPost = {
      ...mockPost,
      ...updatePostDto,
    };

    it('should update a post', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      mockPrismaService.post.update.mockResolvedValue(mockUpdatedPost);

      const result = await service.update(1, updatePostDto);

      expect(mockPrismaService.post.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          user: true,
        },
      });
      expect(mockPrismaService.post.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updatePostDto,
        include: {
          user: true,
        },
      });
      expect(result).toEqual(mockUpdatedPost);
    });

    it('should throw NotFoundException if post not found', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(null);

      await expect(service.update(999, updatePostDto)).rejects.toThrow(
        NotFoundException
      );
      expect(mockPrismaService.post.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
        include: {
          user: true,
        },
      });
      expect(mockPrismaService.post.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    const mockPost = {
      id: 1,
      title: 'Test Post',
      body: 'This is a test post body',
      userId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
      },
    };

    it('should delete a post', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      mockPrismaService.post.delete.mockResolvedValue(mockPost);

      await service.remove(1);

      expect(mockPrismaService.post.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          user: true,
        },
      });
      expect(mockPrismaService.post.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw NotFoundException if post not found', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.post.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
        include: {
          user: true,
        },
      });
      expect(mockPrismaService.post.delete).not.toHaveBeenCalled();
    });
  });

  describe('findByUserId', () => {
    const mockPosts = [
      {
        id: 1,
        title: 'Post 1',
        body: 'Body 1',
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 1,
          name: 'User 1',
          email: 'user1@example.com',
        },
      },
      {
        id: 2,
        title: 'Post 2',
        body: 'Body 2',
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 1,
          name: 'User 1',
          email: 'user1@example.com',
        },
      },
    ];

    it('should return posts by user ID', async () => {
      mockPrismaService.post.findMany.mockResolvedValue(mockPosts);

      const result = await service.findByUserId(1);

      expect(mockPrismaService.post.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        include: {
          user: true,
        },
      });
      expect(result).toEqual(mockPosts);
      expect(result).toHaveLength(2);
    });
  });
});
