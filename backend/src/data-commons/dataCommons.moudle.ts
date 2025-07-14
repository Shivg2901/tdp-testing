import { Module } from '@nestjs/common';
import { DataCommonsService } from './dataCommons.service';
import { DataCommonsController } from './dataCommons.controller';

@Module({
  providers: [DataCommonsService],
  controllers: [DataCommonsController],
})
export class DataCommonsModule {}
