import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AxiosAdapter } from 'src/common/adapters/axios.adapter';
import { Pokemon } from 'src/pokemon/entities/pokemon.entity';
import { PokeResponse } from './interfaces/poke-response.interface';

@Injectable()
export class SeedService {
  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>,
    private readonly http: AxiosAdapter,
  ) {}

  async executeSeed() {
    // clear previous data
    await this.pokemonModel.deleteMany({});

    const data = await this.http.get<PokeResponse>(
      'https://pokeapi.co/api/v2/pokemon?limit=650',
    );

    // 1. Insertar por promesas
    // const insertPromiseArray = [];

    // data.results.forEach(({ name, url }) => {
    //   const segments = url.split('/');
    //   const no: number = +segments[segments.length - 2];

    //   //const pokemon = await this.pokemonModel.create({ name, no });
    //   insertPromiseArray.push(this.pokemonModel.create({ name, no }));
    // });

    // await Promise.all(insertPromiseArray);

    // 2. Otra forma de insertar.
    const pokemonToInsert: { name: string; no: number }[] = [];

    data.results.forEach(({ name, url }) => {
      const segments = url.split('/');
      const no: number = +segments[segments.length - 2];
      pokemonToInsert.push({ name, no });
    });

    await this.pokemonModel.insertMany(pokemonToInsert);

    return `Seed executed: ${data.results.length} registers.`;
  }
}
