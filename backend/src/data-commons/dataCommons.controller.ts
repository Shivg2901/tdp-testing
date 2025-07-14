import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { DataCommonsService } from './dataCommons.service';

@Controller('data-commons')
export class DataCommonsController {
  constructor(private readonly service: DataCommonsService) {}

  @Get('structure')
  getFullStructure() {
    return this.service.getFullStructure();
  }

  @Get('project/:group/:program/:project/file-status')
  getProjectFilesStatus(
    @Param('group') group: string,
    @Param('program') program: string,
    @Param('project') project: string,
  ) {
    return this.service.getProjectFilesStatus(group, program, project);
  }

  @Get('project/:group/:program/:project/description')
  async getProjectDescription(
    @Param('group') group: string,
    @Param('program') program: string,
    @Param('project') project: string,
    @Res() res: Response,
  ) {
    return this.service.sendProjectDescription(group, program, project, res);
  }

  @Get('project/:group/:program/:project/files/:filename')
  async getProjectFile(
    @Param('group') group: string,
    @Param('program') program: string,
    @Param('project') project: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    return this.service.sendProjectFile(group, program, project, filename, res);
  }
}
