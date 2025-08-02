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

  sendProjectFile(
    group: string,
    program: string,
    project: string,
    filename: string,
    res: any,
  ) {
    const projectPath = path.join(DATA_PATH, group, program, project);
    const filePath = path.join(projectPath, filename);

    // Check if the file actually exists
    if (!fs.existsSync(filePath)) {
      res.status(404).send(`${filename} not found`);
      return;
    }
    const lowerCaseFileName = filename.toLowerCase();
    if (lowerCaseFileName.includes('differentialexpression')) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        res.json({ [filename]: content });
      } catch (e) {
        res.status(500).send('Error reading file');
      }
    } else {
      try {
        res.sendFile(filePath);
      } catch (e) {
        res.status(500).send('Error sending file');
      }
    }
  }

  sendProjectFileByKey(
    group: string,
    program: string,
    project: string,
    fileKey: string,
    res: any,
  ) {
    const allowedKeys = [
      'samplesheet',
      'gene',
      'transcript',
      'pca',
      'differentialexpression',
    ];

    const allowedKeysDetailed: Record<string, string[] | string> = {
      samplesheet: ['samplesheet', 'sample'],
      gene: ['gene'],
      transcript: ['transcript'],
      pca: ['pca'],
      differentialexpression: ['differentialexpression'],
    };

    const allowedExtensions = [
      '.png',
      '.jpg',
      '.jpeg',
      '.gif',
      '.bmp',
      '.webp',
    ];
    const lowerCaseFileKey = fileKey.toLowerCase();
    const projectPath = path.join(DATA_PATH, group, program, project);

    if (allowedExtensions.some((ext) => lowerCaseFileKey.endsWith(ext))) {
      const filePath = path.join(projectPath, fileKey);
      if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
      } else {
        res.status(404).send(`${fileKey} not found`);
      }
      return;
    }

    if (!allowedKeys.includes(lowerCaseFileKey)) {
      res.status(403).send({
        allowedKeys: allowedKeys,
        message: 'File key not allowed',
        fileKey: lowerCaseFileKey,
      });
      return;
    }

    let matchTerms = allowedKeysDetailed[lowerCaseFileKey];
    if (!matchTerms) {
      res.status(403).send('No match terms found for this key');
      return;
    }

    if (typeof matchTerms === 'string') {
      matchTerms = [matchTerms];
    }

    let filesInProject: string[] = [];
    try {
      filesInProject = fs.readdirSync(projectPath);
    } catch (e) {
      res.status(404).send('Project folder not found');
      return;
    }

    const matchingFiles = filesInProject.filter((f) => {
      const lowerF = f.toLowerCase();
      return matchTerms.some((term) => lowerF.includes(term.toLowerCase()));
    });

    const result = {
      label: fileKey,
      selectedFile: matchingFiles.length > 0 ? matchingFiles[0] : '',
      filesHavingSameKey: matchingFiles,
      allFiles: filesInProject,
    };

    res.json(result);
  }
}
