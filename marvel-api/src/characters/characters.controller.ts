
import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  ParseEnumPipe,
} from '@nestjs/common';
import { CharactersService } from './characters.service';
import { CreateCharacterDto } from './dto/create-character.dto';
import { CharacterStatus } from './entities/character.entity';

@Controller('characters')
export class CharactersController {
  constructor(
    private readonly charactersService: CharactersService,
  ) {}

  @Get()
  findAll(
    @Query('status', new ParseEnumPipe(CharacterStatus, { optional: true }))
    status?: CharacterStatus,
    @Query('teamId')
    teamId?: string,
  ) {
    return this.charactersService.findAll(
      status,
      teamId === undefined ? undefined : Number(teamId),
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.charactersService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateCharacterDto) {
    return this.charactersService.create(dto);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateCharacterDto,
  ) {
    return this.charactersService.update(id, dto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status', new ParseEnumPipe(CharacterStatus))
    status: CharacterStatus,
  ) {
    return this.charactersService.updateStatus(id, status);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.charactersService.remove(id);
  }
}
