import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { excludePassword } from '../utils/exclude';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const { email, username, password, address, company, ...userData } =
      createUserDto;

    // Check if user with email or username already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      throw new ConflictException(
        `User with email ${email} or username ${username} already exists`
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with nested address and company if provided
    const user = await this.prisma.user.create({
      data: {
        ...userData,
        email,
        username,
        password: hashedPassword,
        ...(address && {
          address: {
            create: {
              street: address.street,
              suite: address.suite,
              city: address.city,
              zipcode: address.zipcode,
              ...(address.geo && {
                geo: {
                  create: {
                    lat: address.geo.lat,
                    lng: address.geo.lng,
                  },
                },
              }),
            },
          },
        }),
        ...(company && {
          company: {
            create: {
              name: company.name,
              catchPhrase: company.catchPhrase,
              bs: company.bs,
            },
          },
        }),
      },
      include: {
        address: {
          include: {
            geo: true,
          },
        },
        company: true,
      },
    });

    return excludePassword(user);
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      include: {
        address: {
          include: {
            geo: true,
          },
        },
        company: true,
      },
    });

    return users.map(user => excludePassword(user));
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        address: {
          include: {
            geo: true,
          },
        },
        company: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return excludePassword(user);
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const { address, company, password, ...userData } = updateUserDto;

    // Check if user exists
    await this.findOne(id);

    // Hash password if provided
    const data: Prisma.UserUpdateInput = { ...userData };
    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    // Update address if provided
    if (address) {
      const existingAddress = await this.prisma.address.findUnique({
        where: { userId: id },
      });

      if (existingAddress) {
        await this.prisma.address.update({
          where: { id: existingAddress.id },
          data: {
            street: address.street,
            suite: address.suite,
            city: address.city,
            zipcode: address.zipcode,
          },
        });

        // Update geo if provided
        if (address.geo) {
          const existingGeo = await this.prisma.geo.findUnique({
            where: { addressId: existingAddress.id },
          });

          if (existingGeo) {
            await this.prisma.geo.update({
              where: { id: existingGeo.id },
              data: {
                lat: address.geo.lat,
                lng: address.geo.lng,
              },
            });
          } else {
            await this.prisma.geo.create({
              data: {
                lat: address.geo.lat,
                lng: address.geo.lng,
                addressId: existingAddress.id,
              },
            });
          }
        }
      } else {
        await this.prisma.address.create({
          data: {
            street: address.street,
            suite: address.suite,
            city: address.city,
            zipcode: address.zipcode,
            userId: id,
            ...(address.geo && {
              geo: {
                create: {
                  lat: address.geo.lat,
                  lng: address.geo.lng,
                },
              },
            }),
          },
        });
      }
    }

    // Update company if provided
    if (company) {
      const existingCompany = await this.prisma.company.findUnique({
        where: { userId: id },
      });

      if (existingCompany) {
        await this.prisma.company.update({
          where: { id: existingCompany.id },
          data: {
            name: company.name,
            catchPhrase: company.catchPhrase,
            bs: company.bs,
          },
        });
      } else {
        await this.prisma.company.create({
          data: {
            name: company.name,
            catchPhrase: company.catchPhrase,
            bs: company.bs,
            userId: id,
          },
        });
      }
    }

    // Update user
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data,
      include: {
        address: {
          include: {
            geo: true,
          },
        },
        company: true,
      },
    });

    return excludePassword(updatedUser);
  }

  async remove(id: number): Promise<void> {
    // Check if user exists
    await this.findOne(id);

    await this.prisma.user.delete({
      where: { id },
    });
  }

  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    return user;
  }
}
