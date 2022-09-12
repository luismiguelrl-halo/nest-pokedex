import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { Pokemon } from './entities/pokemon.entity';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class PokemonService {
  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>,
  ) {}

  async create(createPokemonDto: CreatePokemonDto) {
    createPokemonDto.name = createPokemonDto.name.toLocaleLowerCase();

    try {
      const pokemon = await this.pokemonModel.create(createPokemonDto);
      return pokemon;
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;

    return this.pokemonModel
      .find()
      .limit(limit)
      .skip(offset)
      .sort({ no: 1 })
      .select('-__v');
  }

  async findOne(term: string) {
    let pokemon: Pokemon;

    // Find by No
    if (!isNaN(+term)) {
      pokemon = await this.pokemonModel.findOne({ no: term });
    }
    // Find by MongoId
    if (!pokemon && isValidObjectId(term)) {
      pokemon = await this.pokemonModel.findById(term);
    }

    // Find by Name
    // TODO: revisar porque no devuelve informacion.
    if (!pokemon) {
      console.log(`search by name: ${term}`);
      if (!pokemon) {
        pokemon = await this.pokemonModel.findOne({
          name: term.toLowerCase(),
        });
      }
      console.log(pokemon);
    }

    if (!pokemon)
      throw new NotFoundException(
        `Pokemon with Id, Name or NO: ${term} not found`,
      );

    return pokemon;
  }

  async update(term: string, updatePokemonDto: UpdatePokemonDto) {
    let pokemon = await this.findOne(term);

    if (updatePokemonDto.name) {
      updatePokemonDto.name = updatePokemonDto.name.toLocaleLowerCase();
    }

    try {
      if (pokemon) {
        await pokemon.updateOne(updatePokemonDto);
      }

      return { ...pokemon.toJSON(), ...updatePokemonDto };
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  // async remove(id: string) { // Primera forma de eliminar.
  //   const pokemon = await this.findOne(id);
  //   //this.pokemonModel.findByIdAndDelete(id);
  //   if (pokemon) {
  //     await pokemon.deleteOne();
  //   }
  //   return pokemon;
  // }

  async remove(id: string) {
    //const result = await this.pokemonModel.findByIdAndDelete(id);
    const result = await this.pokemonModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      throw new BadRequestException(`Pokemon with ID ${id} not found.`);
    }
    return result;
  }

  private handleExceptions(error: any) {
    if (error.code === 11000) {
      throw new BadRequestException(
        `Pokemon exists in db ${JSON.stringify(error.keyValue)}`,
      );
    }
    console.log(error);
    throw new InternalServerErrorException(
      `Cannot update pokemon - Check server logs.`,
    );
  }
}
