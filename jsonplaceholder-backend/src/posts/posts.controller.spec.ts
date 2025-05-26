import { Test, TestingModule } from '@nestjs/testing';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { NotFoundException } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

describe('PostsController', () => {
  let controller: PostsController;
  let postsService: PostsService;

  const mockPostsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findByUserId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostsController],
      providers: [
        {
          provide: PostsService,
          useValue: mockPostsService,
        },
      ],
    }).compile();

    controller = module.get<PostsController>(PostsController);
    postsService = module.get<PostsService>(PostsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createPostDto: CreatePostDto = {
      title: 'Test Post',
      body: 'This is a test post body',
      userId: 1,
    };

    const mockCreatedPost = {
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

    it('should create a post successfully', async () => {
      mockPostsService.create.mockResolvedValue(mockCreatedPost);

      const mockRequest = {
        user: {
          id: 1,
          email: 'test@example.com',
        },
      };

      const result = await controller.create(mockRequest as any, createPostDto);

      expect(mockPostsService.create).toHaveBeenCalledWith(createPostDto, 1);
      expect(result).toEqual(mockCreatedPost);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockPostsService.create.mockRejectedValue(
        new NotFoundException('User not found')
      );

      const mockRequest = {
        user: {
          id: 999,
          email: 'nonexistent@example.com',
        },
      };

      await expect(
        controller.create(mockRequest as any, createPostDto)
      ).rejects.toThrow(NotFoundException);
      expect(mockPostsService.create).toHaveBeenCalledWith(createPostDto, 999);
    });
  });

  describe('findAll', () => {
    const mockPosts = [
      {
        id: 1,
        title: 'Post 1',
        body: 'Body 1',
        userId: 1,
        user: {
          id: 1,
          name: 'User 1',
        },
      },
      {
        id: 2,
        title: 'Post 2',
        body: 'Body 2',
        userId: 2,
        user: {
          id: 2,
          name: 'User 2',
        },
      },
    ];

    it('should return an array of posts', async () => {
      mockPostsService.findAll.mockResolvedValue(mockPosts);

      const result = await controller.findAll();

      expect(mockPostsService.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockPosts);
    });
  });

  describe('findOne', () => {
    const mockPost = {
      id: 1,
      title: 'Test Post',
      body: 'This is a test post body',
      userId: 1,
      user: {
        id: 1,
        name: 'Test User',
      },
    };

    it('should return a single post', async () => {
      mockPostsService.findOne.mockResolvedValue(mockPost);

      const result = await controller.findOne(1);

      expect(mockPostsService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockPost);
    });

    it('should throw NotFoundException when post not found', async () => {
      mockPostsService.findOne.mockRejectedValue(
        new NotFoundException('Post not found')
      );

      await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
      expect(mockPostsService.findOne).toHaveBeenCalledWith(999);
    });
  });

  describe('update', () => {
    const updatePostDto: UpdatePostDto = {
      title: 'Updated Post',
      body: 'This is an updated post body',
    };

    const mockUpdatedPost = {
      id: 1,
      title: 'Updated Post',
      body: 'This is an updated post body',
      userId: 1,
      user: {
        id: 1,
        name: 'Test User',
      },
    };

    it('should update a post successfully', async () => {
      mockPostsService.update.mockResolvedValue(mockUpdatedPost);

      const result = await controller.update(1, updatePostDto);

      expect(mockPostsService.update).toHaveBeenCalledWith(1, updatePostDto);
      expect(result).toEqual(mockUpdatedPost);
    });

    it('should throw NotFoundException when post not found', async () => {
      mockPostsService.update.mockRejectedValue(
        new NotFoundException('Post not found')
      );

      await expect(controller.update(999, updatePostDto)).rejects.toThrow(
        NotFoundException
      );
      expect(mockPostsService.update).toHaveBeenCalledWith(999, updatePostDto);
    });
  });

  describe('remove', () => {
    it('should remove a post successfully', async () => {
      mockPostsService.remove.mockResolvedValue(undefined);

      await controller.remove(1);

      expect(mockPostsService.remove).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when post not found', async () => {
      mockPostsService.remove.mockRejectedValue(
        new NotFoundException('Post not found')
      );

      await expect(controller.remove(999)).rejects.toThrow(NotFoundException);
      expect(mockPostsService.remove).toHaveBeenCalledWith(999);
    });
  });

  describe('findByUserId', () => {
    const mockPosts = [
      {
        id: 1,
        title: 'Post 1',
        body: 'Body 1',
        userId: 1,
        user: {
          id: 1,
          name: 'User 1',
        },
      },
      {
        id: 2,
        title: 'Post 2',
        body: 'Body 2',
        userId: 1,
        user: {
          id: 1,
          name: 'User 1',
        },
      },
    ];

    it('should return posts by user ID', async () => {
      mockPostsService.findByUserId.mockResolvedValue(mockPosts);

      const result = await controller.findByUserId(1);

      expect(mockPostsService.findByUserId).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockPosts);
    });
  });
});
