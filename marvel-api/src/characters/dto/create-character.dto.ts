
import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { CharacterStatus } from '../entities/character.entity';

export class CreateCharacterDto {
  @IsString()
  @IsNotEmpty()
  realName: string;

  @IsString()
  @IsNotEmpty()
  alias: string;

  @IsString()
  @IsNotEmpty()
  mainPower: string;

  @IsInt()
  @Min(1)
  @Max(100)
  powerLevel: number;

  @IsEnum(CharacterStatus)
  status: CharacterStatus;

  @IsBoolean()
  isVillain: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  teamId?: number | null;
}
