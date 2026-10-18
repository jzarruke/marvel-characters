import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { TeamsService } from './teams.service';
import type { TeamBody } from './interfaces/team-body.interface';

@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  findAll() {
    return this.teamsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.teamsService.findOne(id);
  }

  @Get(':id/characters')
  findCharactersByTeamId(@Param('id', ParseIntPipe) id: number) {
    return this.teamsService.findCharactersByTeamId(id);
  }

  @Post()
  create(@Body() body: TeamBody) {
    return this.teamsService.create(body);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: TeamBody) {
    return this.teamsService.update(id, body);
  }

  @Patch(':id/characters')
  addCharactersToTeam(
    @Param('id', ParseIntPipe) id: number,
    @Body('characterIds') characterIds: number[],
  ) {
    return this.teamsService.addCharacterToTeam(id, characterIds);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.teamsService.remove(id);
  }
}
