import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPostDto: CreatePostDto, userId?: number) {
    const { userId: dtoUserId, ...data } = createPostDto;

    // Use the userId from the token if available, otherwise use the one from the DTO
    const finalUserId = userId || dtoUserId;

    if (!finalUserId) {
      throw new Error('User ID is required');
    }

    // Check if user exists
    const userExists = await this.prisma.user.findUnique({
      where: { id: finalUserId },
      select: { id: true },
    });

    if (!userExists) {
      throw new NotFoundException(`User with ID ${finalUserId} not found`);
    }

    const post = await this.prisma.post.create({
      data: {
        ...data,
        userId: finalUserId,
      },
      include: {
        user: true,
      },
    });

    return post;
  }

  async findAll() {
    const posts = await this.prisma.post.findMany({
      include: {
        user: true,
      },
    });

    return posts;
  }

  async findOne(id: number) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    return post;
  }

  async update(id: number, updatePostDto: UpdatePostDto) {
    // Check if post exists
    await this.findOne(id);

    const post = await this.prisma.post.update({
      where: { id },
      data: updatePostDto,
      include: {
        user: true,
      },
    });

    return post;
  }

  async remove(id: number): Promise<void> {
    // Check if post exists
    await this.findOne(id);

    await this.prisma.post.delete({
      where: { id },
    });
  }

  async findByUserId(userId: number) {
    const posts = await this.prisma.post.findMany({
      where: { userId },
      include: {
        user: true,
      },
    });

    return posts;
  }
}
