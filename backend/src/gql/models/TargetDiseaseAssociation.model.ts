import { Field, ObjectType, Float, ID } from '@nestjs/graphql';

@ObjectType()
export class ScoredKeyValue {
  @Field(() => String)
  key: string;

  @Field(() => Float)
  score: number;
}

@ObjectType()
export class Target {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  name: string;

  prioritization?: ScoredKeyValue[];
}

@ObjectType()
export class TargetDiseaseAssociation {
  @Field()
  target: Target;

  @Field(() => [ScoredKeyValue])
  datasourceScores: ScoredKeyValue[];

  @Field(() => Float)
  overall_score: number;
}
