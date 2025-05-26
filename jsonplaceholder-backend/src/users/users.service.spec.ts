import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Mock implementations
jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    address: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    geo: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    company: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createUserDto = {
      name: 'Test User',
      username: 'testuser',
      email: 'test@example.com',
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

    const mockCreatedUser = {
      id: 1,
      ...createUserDto,
      password: 'hashedPassword',
      createdAt: new Date(),
      updatedAt: new Date(),
      address: {
        id: 1,
        ...createUserDto.address,
        userId: 1,
        geo: {
          id: 1,
          ...createUserDto.address.geo,
          addressId: 1,
        },
      },
      company: {
        id: 1,
        ...createUserDto.company,
        userId: 1,
      },
    };

    it('should create a user with address and company', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      mockPrismaService.user.create.mockResolvedValue(mockCreatedUser);

      const result = await service.create(createUserDto);

      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { email: createUserDto.email },
            { username: createUserDto.username },
          ],
        },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(mockPrismaService.user.create).toHaveBeenCalled();
      expect(result).toEqual(
        expect.objectContaining({
          id: mockCreatedUser.id,
          name: mockCreatedUser.name,
          email: mockCreatedUser.email,
          // password should be excluded
        })
      );
      expect(result).not.toHaveProperty('password');
    });

    it('should throw ConflictException if user with email already exists', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({
        id: 2,
        email: createUserDto.email,
      });

      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException
      );
      expect(mockPrismaService.user.findFirst).toHaveBeenCalled();
      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    const mockUsers = [
      {
        id: 1,
        name: 'User 1',
        email: 'user1@example.com',
        username: 'user1',
        password: 'hashedPassword1',
        phone: '123-456-7890',
        website: 'example1.com',
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
          name: 'Company 1',
          catchPhrase: 'Catchphrase 1',
          bs: 'BS 1',
          userId: 1,
        },
      },
      {
        id: 2,
        name: 'User 2',
        email: 'user2@example.com',
        username: 'user2',
        password: 'hashedPassword2',
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

    it('should return all users without passwords', async () => {
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.findAll();

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        include: {
          address: {
            include: {
              geo: true,
            },
          },
          company: true,
        },
      });
      expect(result).toHaveLength(2);
      expect(result[0]).not.toHaveProperty('password');
      expect(result[1]).not.toHaveProperty('password');
    });
  });

  describe('findOne', () => {
    const mockUser = {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      username: 'testuser',
      password: 'hashedPassword',
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

    it('should return a user by ID without password', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOne(1);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          address: {
            include: {
              geo: true,
            },
          },
          company: true,
        },
      });
      expect(result).toEqual(
        expect.objectContaining({
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
        })
      );
      expect(result).not.toHaveProperty('password');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
        include: {
          address: {
            include: {
              geo: true,
            },
          },
          company: true,
        },
      });
    });
  });

  // Additional tests for update and remove methods would follow the same pattern
});
