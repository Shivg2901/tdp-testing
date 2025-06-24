import { Module } from '@nestjs/common';
import { ClickhouseService } from './clickhouse.service';
import { ClickhouseMigrationService } from './clickhouse-migration.service';

@Module({
  providers: [ClickhouseMigrationService, ClickhouseService],
  exports: [ClickhouseService],
})
export class ClickhouseModule {}
