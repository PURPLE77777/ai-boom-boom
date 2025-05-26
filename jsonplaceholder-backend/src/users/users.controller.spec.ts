import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;

  const mockUsersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
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
      name: 'Test User',
      username: 'testuser',
      email: 'test@example.com',
      phone: '123-456-7890',
      website: 'example.com',
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

    it('should create a user successfully', async () => {
      mockUsersService.create.mockResolvedValue(mockCreatedUser);

      const result = await controller.create(createUserDto);

      expect(mockUsersService.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(mockCreatedUser);
    });

    it('should throw ConflictException when user already exists', async () => {
      mockUsersService.create.mockRejectedValue(
        new ConflictException('User already exists')
      );

      await expect(controller.create(createUserDto)).rejects.toThrow(
        ConflictException
      );
      expect(mockUsersService.create).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('findAll', () => {
    const mockUsers = [
      {
        id: 1,
        name: 'User 1',
        email: 'user1@example.com',
      },
      {
        id: 2,
        name: 'User 2',
        email: 'user2@example.com',
      },
    ];

    it('should return an array of users', async () => {
      mockUsersService.findAll.mockResolvedValue(mockUsers);

      const result = await controller.findAll();

      expect(mockUsersService.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
    });
  });

  describe('findOne', () => {
    const mockUser = {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
    };

    it('should return a single user', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);

      const result = await controller.findOne(1);

      expect(mockUsersService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUsersService.findOne.mockRejectedValue(
        new NotFoundException('User not found')
      );

      await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
      expect(mockUsersService.findOne).toHaveBeenCalledWith(999);
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      name: 'Updated User',
      email: 'updated@example.com',
    };

    const mockUpdatedUser = {
      id: 1,
      name: 'Updated User',
      email: 'updated@example.com',
    };

    it('should update a user successfully', async () => {
      mockUsersService.update.mockResolvedValue(mockUpdatedUser);

      const result = await controller.update(1, updateUserDto);

      expect(mockUsersService.update).toHaveBeenCalledWith(1, updateUserDto);
      expect(result).toEqual(mockUpdatedUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUsersService.update.mockRejectedValue(
        new NotFoundException('User not found')
      );

      await expect(controller.update(999, updateUserDto)).rejects.toThrow(
        NotFoundException
      );
      expect(mockUsersService.update).toHaveBeenCalledWith(999, updateUserDto);
    });
  });

  describe('remove', () => {
    it('should remove a user successfully', async () => {
      mockUsersService.remove.mockResolvedValue(undefined);

      await controller.remove(1);

      expect(mockUsersService.remove).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUsersService.remove.mockRejectedValue(
        new NotFoundException('User not found')
      );

      await expect(controller.remove(999)).rejects.toThrow(NotFoundException);
      expect(mockUsersService.remove).toHaveBeenCalledWith(999);
    });
  });
});
