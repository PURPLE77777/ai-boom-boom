import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Mock implementations
jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      username: 'testuser',
      name: 'Test User',
      password: 'hashedPassword',
    };

    it('should return user without password if credentials are valid', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(
        'test@example.com',
        'password123'
      );

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        mockUser.password
      );
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
        name: mockUser.name,
      });
    });

    it('should return null if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser(
        'nonexistent@example.com',
        'password123'
      );

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'nonexistent@example.com' },
      });
      expect(result).toBeNull();
    });

    it('should return null if password is invalid', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser(
        'test@example.com',
        'wrongpassword'
      );

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'wrongpassword',
        mockUser.password
      );
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      username: 'testuser',
      name: 'Test User',
    };

    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    let validateUserSpy: jest.SpyInstance;

    beforeEach(() => {
      validateUserSpy = jest.spyOn(service, 'validateUser');
    });

    it('should return access token and user if credentials are valid', async () => {
      // Mock validateUser to return a user
      validateUserSpy.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('test.jwt.token');

      const result = await service.login(loginDto);

      expect(validateUserSpy).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password
      );
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
      });
      expect(result).toEqual({
        accessToken: 'test.jwt.token',
        user: mockUser,
      });
    });

    it('should throw UnauthorizedException if credentials are invalid', async () => {
      // Mock validateUser to return null (invalid credentials)
      validateUserSpy.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException
      );
      expect(validateUserSpy).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password
      );
    });
  });
});
