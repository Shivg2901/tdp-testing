import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import {
  ALLOWED_EXTENSIONS,
  findDifferentialExpressionFiles,
  findFirstFileWithExtension,
  getDirectories,
  getFiles,
} from './dataCommons.utils';

const DATA_PATH =
  process.env.DATA_COMMONS_PATH ||
  path.join(process.cwd(), 'src', 'data-commons', 'data');

@Injectable()
export class DataCommonsService {
  getFullStructure() {
    const structure = [];
    const groups = getDirectories(DATA_PATH);
    for (const group of groups) {
      const groupObj: any = { name: group, programs: [] };
      const groupPath = path.join(DATA_PATH, group);
      const programs = getDirectories(groupPath);
      for (const program of programs) {
        const programObj: any = { name: program, projects: [] };
        const programPath = path.join(groupPath, program);
        const projects = getDirectories(programPath);
        for (const project of projects) {
          const projectObj: any = { name: project, files: [] };
          const projectPath = path.join(programPath, project);
          const files = getFiles(projectPath);
          projectObj.hasData = files.length > 0;
          projectObj.files = files;
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
      'samplesheet.valid.csv',
      'contrastsheet.valid.csv',
      'salmon.merged.gene_counts.tsv',
      'salmon.merged.transcript_counts.tsv',
      'PCA.csv',
    ];

    type FilesPresent = {
      [key: string]: boolean | string[] | string | false;
    };

    const filesPresent: FilesPresent = {};
    let filesInProject: string[] = [];
    try {
      filesInProject = fs.readdirSync(projectPath);
    } catch (e) {
      return { error: 'Project folder not found', filesPresent: {} };
    }

    for (const file of expectedFiles) {
      filesPresent[file] = filesInProject.includes(file);
    }

    const descriptionFile = findFirstFileWithExtension(
      filesInProject,
      ALLOWED_EXTENSIONS,
    );
    filesPresent['project_description'] = descriptionFile || false;

    const deFiles = findDifferentialExpressionFiles(filesInProject);
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
    const projectPath = path.join(DATA_PATH, group, program, project);
    const allowedExtensions = [
      '.png',
      '.jpg',
      '.jpeg',
      '.gif',
      '.bmp',
      '.webp',
    ];
    if (!fs.existsSync(projectPath)) {
      res.status(404).send('Project folder not found');
      return;
    }
    const files = fs.readdirSync(projectPath);
    const descriptionFiles = files.filter((f) =>
      allowedExtensions.some((ext) => f.toLowerCase().endsWith(ext)),
    );
    if (descriptionFiles.length > 0) {
      const result: Record<string, string> = {};
      for (const file of descriptionFiles) {
        result[file] = file;
      }
      res.json(result);
    } else {
      res.status(404).send('No description file found');
    }
  }

  // sendProjectFile(
  //   group: string,
  //   program: string,
  //   project: string,
  //   filename: string,
  //   res: any,
  // ) {
  //   const allowedFiles = [
  //     'samplesheet.valid.csv',
  //     'contrastsheet.valid.csv',
  //     'salmon.merged.gene_counts.tsv',
  //     'salmon.merged.transcript_counts.tsv',
  //     'PCA.csv',
  //     'DifferentialExpression.csv',
  //   ];
  //   const projectPath = path.join(DATA_PATH, group, program, project);

  //   if (filename === 'DifferentialExpression') {
  //     let filesInProject: string[] = [];
  //     try {
  //       filesInProject = fs.readdirSync(projectPath);
  //     } catch (e) {
  //       res.status(404).send('Project folder not found');
  //       return;
  //     }
  //     const deFiles = filesInProject.filter(
  //       (f) =>
  //         f === 'DifferentialExpression.csv' ||
  //         (f.startsWith('DifferentialExpression-') && f.endsWith('.csv')),
  //     );
  //     if (deFiles.length === 0) {
  //       res.status(404).send('No DifferentialExpression files found');
  //       return;
  //     }
  //     const result: Record<string, string> = {};
  //     for (const file of deFiles) {
  //       const filePath = path.join(projectPath, file);
  //       try {
  //         result[file] = fs.readFileSync(filePath, 'utf8');
  //       } catch (e) {
  //         result[file] = '';
  //       }
  //     }
  //     res.json(result);
  //     return;
  //   }

  //   if (
  //     allowedFiles.includes(filename) ||
  //     (filename.startsWith('DifferentialExpression-') &&
  //       filename.endsWith('.csv'))
  //   ) {
  //     const filePath = path.join(projectPath, filename);
  //     if (fs.existsSync(filePath)) {
  //       res.sendFile(filePath);
  //     } else {
  //       res.status(404).send(`${filename} not found`);
  //     }
  //   } else {
  //     res.status(403).send('File not allowed');
  //   }
  // }

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
    const allowedExtensions = [
      '.png',
      '.jpg',
      '.jpeg',
      '.gif',
      '.bmp',
      '.webp',
    ];
    const projectPath = path.join(DATA_PATH, group, program, project);

    if (
      allowedFiles.includes(filename) ||
      allowedExtensions.some((ext) => filename.toLowerCase().endsWith(ext))
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
