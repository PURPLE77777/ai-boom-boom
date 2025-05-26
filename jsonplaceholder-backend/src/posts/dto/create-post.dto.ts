import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePostDto {
  @ApiProperty({
    example:
      'sunt aut facere repellat provident occaecati excepturi optio reprehenderit',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example:
      'quia et suscipit suscipit recusandae consequuntur expedita et cum reprehenderit molestiae ut ut quas totam nostrum rerum est autem sunt rem eveniet architecto',
  })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsOptional()
  userId?: number;
}
