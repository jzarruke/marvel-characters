
import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Character,
  CharacterStatus,
} from './entities/character.entity';
import { CreateCharacterDto } from './dto/create-character.dto';
import { Team } from '../teams/entities/team.entity';

@Injectable()
export class CharactersService {
  constructor(
    @InjectRepository(Character)
    private readonly charactersRepository: Repository<Character>,
    @InjectRepository(Team)
    private readonly teamsRepository: Repository<Team>,
  ) {}

  findAll(status?: CharacterStatus, teamId?: number): Promise<Character[]> {
    const where: any = {};

    if (status) where.status = status;
    if (teamId !== undefined) where.teamId = teamId;

    return this.charactersRepository.find({
      where,
      relations: { team: true },
    });
  }

  async findOne(id: number): Promise<Character> {
    const character = await this.charactersRepository.findOne({
      where: { id },
      relations: { team: true },
    });

    if (!character) {
      throw new NotFoundException('Character not found');
    }

    return character;
  }

  async create(dto: CreateCharacterDto): Promise<Character> {
    const duplicate = await this.charactersRepository.findOneBy({
      alias: dto.alias,
    });

    if (duplicate) {
      throw new ConflictException('Character alias already exists');
    }

    if (dto.teamId != null) {
      const team = await this.teamsRepository.findOneBy({ id: dto.teamId });
      if (!team) throw new NotFoundException('Team not found');
      if (!team.active) throw new BadRequestException('Team is inactive');
    }

    const character = this.charactersRepository.create({
      ...dto,
      teamId: dto.teamId ?? null,
    });

    return this.charactersRepository.save(character);
  }

  async update(id: number, dto: CreateCharacterDto): Promise<Character> {
    const character = await this.findOne(id);

    const duplicate = await this.charactersRepository.findOneBy({
      alias: dto.alias,
    });

    if (duplicate && duplicate.id !== id) {
      throw new ConflictException('Character alias already exists');
    }

    if (dto.teamId != null) {
      const team = await this.teamsRepository.findOneBy({ id: dto.teamId });
      if (!team) throw new NotFoundException('Team not found');
      if (!team.active) throw new BadRequestException('Team is inactive');
    }

    Object.assign(character, dto, { teamId: dto.teamId ?? null });
    return this.charactersRepository.save(character);
  }

  async updateStatus(id: number, status: CharacterStatus): Promise<Character> {
    const character = await this.findOne(id);

    if (!Object.values(CharacterStatus).includes(status)) {
      throw new BadRequestException('Invalid character status');
    }

    if (
      character.status === CharacterStatus.RETIRED &&
      status === CharacterStatus.INJURED
    ) {
      throw new BadRequestException(
        'A retired character cannot transition directly to INJURED',
      );
    }

    character.status = status;
    return this.charactersRepository.save(character);
  }

  async remove(id: number): Promise<void> {
    const character = await this.findOne(id);
    await this.charactersRepository.remove(character);
  }
}
