import { Resolver, Query, Args, Context, Info, Int } from '@nestjs/graphql';
import { HttpException, HttpStatus } from '@nestjs/common';
import { GqlService } from './gql.service';
import { RedisService } from '@/redis/redis.service';
import { isUUID } from 'class-validator';
import { ConfigService } from '@nestjs/config';
import {
  DataRequired,
  Gene,
  GeneInteractionOutput,
  Header,
  InteractionInput,
  TopGene,
} from './models';
import type { FieldNode, GraphQLResolveInfo } from 'graphql';
import { Request } from 'express';
import { ClickhouseService } from '@/clickhouse/clickhouse.service';

@Resolver('gql')
export class GqlResolver {
  constructor(
    private readonly gqlService: GqlService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    private readonly clickhouseService: ClickhouseService,
  ) {}

  @Query(() => [Gene])
  async genes(
    @Args('geneIDs', { type: () => [String] }) geneIDs: string[],
    @Args('config', { type: () => [DataRequired], nullable: true })
    config: Array<DataRequired> | undefined,
    @Info() info: GraphQLResolveInfo,
  ): Promise<Gene[]> {
    const bringMeta = info.fieldNodes[0].selectionSet.selections.some(
      (selection: FieldNode) =>
        !['ID', 'common', 'disease'].includes(selection?.name.value),
    );
    const genes = this.gqlService.getGenes(geneIDs, config, bringMeta);
    return config ? this.gqlService.filterGenes(genes, config) : genes;
  }

  @Query(() => Header)
  async headers(
    @Args('disease', { type: () => String }) disease: string,
    @Info() info: GraphQLResolveInfo,
  ) {
    const bringCommon =
      info.fieldNodes[0].selectionSet.selections.find(
        (val: FieldNode) => val.name.value === 'common',
      ) !== undefined;
    return this.gqlService.getHeaders(disease, bringCommon);
  }

  @Query(() => GeneInteractionOutput)
  async getGeneInteractions(
    @Args('input', { type: () => InteractionInput }) input: InteractionInput,
    @Args('order', { type: () => Int }) order: number,
    @Context('req') req: Request,
  ): Promise<GeneInteractionOutput> {
    const userID = req.cookies['user-id'] ?? crypto.randomUUID();
    if (!isUUID(userID))
      throw new HttpException(
        'Correct user ID not found',
        HttpStatus.UNAUTHORIZED,
      );
    if (!req.cookies['user-id']) {
      await this.redisService.redisClient.set(
        `user:${userID}`,
        '',
        'EX',
        this.configService.get('REDIS_USER_EXPIRY', 7200),
      );

      req.res?.cookie('user-id', userID, {
        maxAge: this.configService.get('REDIS_USER_EXPIRY', 7200) * 1000,
        httpOnly: true,
        secure: this.configService.get('NODE_ENV') === 'production',
        sameSite: 'strict',
      });
    }
    const graphName =
      input.graphName ??
      this.gqlService.computeHash(
        JSON.stringify({
          ...input,
          geneIDs: input.geneIDs.sort(),
          order,
        }),
      );
    const result = await this.gqlService.getGeneInteractions(
      input,
      order,
      graphName,
      userID,
    );
    return {
      genes: result.genes,
      links: result.links,
      graphName,
    };
  }

  @Query(() => [TopGene])
  async topGenesByDisease(
    @Args('diseaseId', { type: () => String }) diseaseId: string,
    @Args('limit', { type: () => Int, defaultValue: 25 }) limit: number,
  ): Promise<TopGene[]> {
    return this.clickhouseService.getTopGenesByDisease(diseaseId, limit);
  }
}
