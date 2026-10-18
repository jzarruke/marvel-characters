import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, QueryFailedError, Repository } from 'typeorm';
import { Team } from './entities/team.entity';
import { Character } from '../characters/entities/character.entity';
// Sé que se debería usar DTOs, sin embargo, como no sé han explicado, usaré interfaces para validar el body de las requests
import type { TeamBody } from './interfaces/team-body.interface';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private teamsRepository: Repository<Team>,
    @InjectRepository(Character)
    private charactersRepository: Repository<Character>,
  ) {}

  findAll(): Promise<Team[]> {
    return this.teamsRepository.find({ order: { id: 'ASC' } });
  }

  async findOne(id: number): Promise<Team> {
    const team = await this.teamsRepository.findOneBy({ id });
    if (!team) {
      throw new NotFoundException(`Team ${id} not found`);
    }
    return team;
  }

  async findCharactersByTeamId(teamId: number): Promise<Character[]> {
    const exists = await this.teamsRepository.existsBy({ id: teamId });
    if (!exists) {
      throw new NotFoundException(`Team ${teamId} not found`);
    }
    // SELECT * FROM characters WHERE team_id = :teamId
    return this.charactersRepository.find({ where: { teamId } });
  }

  async create(body: TeamBody): Promise<Team> {
    this.validateBody(body);
    const { characterIds = [] } = body;

    let teamId: number;
    try {
      teamId = await this.teamsRepository.manager.transaction(async (em) => {
        const team = em.create(Team, {
          name: body.name,
          base: body.base ?? null,
          foundedYear: body.foundedYear ?? null,
          active: body.active ?? true,
        });
        const saved = await em.save(Team, team);
        if (characterIds.length > 0) {
          await this.assignCharacters(em, saved.id, characterIds);
        }
        return saved.id;
      });
    } catch (e) {
      throw this.mapDbError(e);
    }
    return this.findOne(teamId);
  }

  async update(id: number, body: TeamBody): Promise<Team> {
    this.validateBody(body);
    const team = await this.teamsRepository.findOneBy({ id });
    if (!team) {
      throw new NotFoundException(`Team ${id} not found`);
    }
    // PUT reemplaza el recurso completo: lo que no llega vuelve a su valor por defecto
    team.name = body.name;
    team.base = body.base ?? null;
    team.foundedYear = body.foundedYear ?? null;
    team.active = body.active ?? true;
    team.updatedAt = new Date();
    try {
      await this.teamsRepository.save(team);
    } catch (e) {
      throw this.mapDbError(e);
    }
    return this.findOne(id);
  }

  async addCharacterToTeam(teamId: number, characterIds: number[]): Promise<Character[]> {
    if (!Array.isArray(characterIds) || characterIds.length === 0) {
      throw new BadRequestException('characterIds must be a non-empty array');
    }
    await this.teamsRepository.manager.transaction(async (em) => {
      const exists = await em.existsBy(Team, { id: teamId });
      if (!exists) {
        throw new NotFoundException(`Team ${teamId} not found`);
      }
      await this.assignCharacters(em, teamId, characterIds);
    });
    return this.findCharactersByTeamId(teamId);
  }

  async remove(id: number): Promise<void> {
    const exists = await this.teamsRepository.existsBy({ id });
    if (!exists) {
      throw new NotFoundException(`Team ${id} not found`);
    }
    // La FK characters.team_id tiene ON DELETE RESTRICT
    const members = await this.charactersRepository.countBy({ teamId: id });
    if (members > 0) {
      throw new ConflictException(
        `Team ${id} still has ${members} characters assigned`,
      );
    }
    await this.teamsRepository.delete(id);
  }

  private async assignCharacters(
    em: EntityManager,
    teamId: number,
    ids: number[],
  ): Promise<void> {
    if (!ids.every((id) => Number.isInteger(id))) {
      throw new BadRequestException('characterIds must contain only integers');
    }
    const unique = [...new Set(ids)];
    const found = await em.findBy(Character, { id: In(unique) });
    if (found.length !== unique.length) {
      const missing = unique.filter((id) => !found.some((c) => c.id === id));
      throw new NotFoundException(`Characters not found: ${missing.join(', ')}`);
    }
    // UPDATE characters SET team_id = :teamId WHERE id IN (:...ids)
    await em.update(
      Character,
      { id: In(unique) },
      { teamId, updatedAt: new Date() },
    );
  }

  private validateBody(body: TeamBody): void {
    if (!body || typeof body.name !== 'string' || body.name.trim() === '') {
      throw new BadRequestException('name is required');
    }
    if (body.characterIds !== undefined && !Array.isArray(body.characterIds)) {
      throw new BadRequestException('characterIds must be an array');
    }
  }

  private mapDbError(e: unknown): unknown {
    if (e instanceof QueryFailedError) {
      const code = (e.driverError as { code?: string } | undefined)?.code;
      if (code === '23505') {
        return new ConflictException('A team with that name already exists');
      }
    }
    return e;
  }
}
