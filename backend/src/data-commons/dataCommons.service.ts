import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

const DATA_PATH =
  process.env.DATA_COMMONS_PATH ||
  path.join(process.cwd(), 'src', 'data-commons', 'data');

@Injectable()
export class DataCommonsService {
  getFullStructure() {
    const structure = [];
    const groups = fs
      .readdirSync(DATA_PATH)
      .filter((f) => fs.statSync(path.join(DATA_PATH, f)).isDirectory());
    for (const group of groups) {
      const groupObj: any = { name: group, programs: [] };
      const groupPath = path.join(DATA_PATH, group);
      const programs = fs
        .readdirSync(groupPath)
        .filter((f) => fs.statSync(path.join(groupPath, f)).isDirectory());
      for (const program of programs) {
        const programObj: any = { name: program, projects: [] };
        const programPath = path.join(groupPath, program);
        const projects = fs
          .readdirSync(programPath)
          .filter((f) => fs.statSync(path.join(programPath, f)).isDirectory());
        for (const project of projects) {
          const projectObj: any = { name: project, studies: [] };
          const projectPath = path.join(programPath, project);
          const studies = fs
            .readdirSync(projectPath)
            .filter((f) =>
              fs.statSync(path.join(projectPath, f)).isDirectory(),
            );
          if (studies.length === 0) {
            const files = fs
              .readdirSync(projectPath)
              .filter((f) => fs.statSync(path.join(projectPath, f)).isFile());
            projectObj.studies.push({
              name: project,
              hasData: files.length > 0,
              files: files,
            });
          } else {
            for (const study of studies) {
              const studyPath = path.join(projectPath, study);
              const files = fs
                .readdirSync(studyPath)
                .filter((f) => fs.statSync(path.join(studyPath, f)).isFile());
              projectObj.studies.push({
                name: study,
                hasData: files.length > 0,
                files: files,
              });
            }
          }
          programObj.projects.push(projectObj);
        }
        groupObj.programs.push(programObj);
      }
      structure.push(groupObj);
    }
    return structure;
  }

  getProjectFilesStatus(group: string, program: string, project: string) {
    const projectPath = path.join(DATA_PATH, group, program, project);
    const expectedFiles = [
      'project_description.png',
      'samplesheet.valid.csv',
      'contrastsheet.valid.csv',
      'salmon.merged.gene_counts.tsv',
      'salmon.merged.transcript_counts.tsv',
      'PCA.csv',
    ];

    const filesPresent: Record<string, boolean | string[]> = {};
    let filesInProject: string[] = [];
    try {
      filesInProject = fs.readdirSync(projectPath);
    } catch (e) {
      return { error: 'Project folder not found', filesPresent: {} };
    }

    for (const file of expectedFiles) {
      filesPresent[file] = filesInProject.includes(file);
    }

    const deFiles = filesInProject.filter(
      (f) =>
        f === 'DifferentialExpression.csv' ||
        (f.startsWith('DifferentialExpression-') && f.endsWith('.csv')),
    );
    filesPresent['DifferentialExpression.csv'] =
      deFiles.length > 0 ? deFiles : false;

    return filesPresent;
  }

  sendProjectDescription(
    group: string,
    program: string,
    project: string,
    res: any,
  ) {
    const filePath = path.join(
      DATA_PATH,
      group,
      program,
      project,
      'project_description.png',
    );
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).send('project_description.png not found');
    }
  }

  sendProjectFile(
    group: string,
    program: string,
    project: string,
    filename: string,
    res: any,
  ) {
    const allowedFiles = [
      'samplesheet.valid.csv',
      'contrastsheet.valid.csv',
      'salmon.merged.gene_counts.tsv',
      'salmon.merged.transcript_counts.tsv',
      'PCA.csv',
      'DifferentialExpression.csv',
    ];
    const projectPath = path.join(DATA_PATH, group, program, project);

    if (filename === 'DifferentialExpression') {
      let filesInProject: string[] = [];
      try {
        filesInProject = fs.readdirSync(projectPath);
      } catch (e) {
        res.status(404).send('Project folder not found');
        return;
      }
      const deFiles = filesInProject.filter(
        (f) =>
          f === 'DifferentialExpression.csv' ||
          (f.startsWith('DifferentialExpression-') && f.endsWith('.csv')),
      );
      if (deFiles.length === 0) {
        res.status(404).send('No DifferentialExpression files found');
        return;
      }
      const result: Record<string, string> = {};
      for (const file of deFiles) {
        const filePath = path.join(projectPath, file);
        try {
          result[file] = fs.readFileSync(filePath, 'utf8');
        } catch (e) {
          result[file] = '';
        }
      }
      res.json(result);
      return;
    }

    if (
      allowedFiles.includes(filename) ||
      (filename.startsWith('DifferentialExpression-') &&
        filename.endsWith('.csv'))
    ) {
      const filePath = path.join(projectPath, filename);
      if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
      } else {
        res.status(404).send(`${filename} not found`);
      }
    } else {
      res.status(403).send('File not allowed');
    }
  }
}
