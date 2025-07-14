'use client';
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

type Project = {
  name: string;
  studies: { name: string; hasData: boolean; files: string[] }[];
};

type Program = {
  name: string;
  projects: Project[];
};

type Group = {
  name: string;
  programs: Program[];
};

export default function DataCommonsPage() {
  const [structure, setStructure] = React.useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = React.useState<string>('');
  const [selectedProgram, setSelectedProgram] = React.useState<string>('');
  const [selectedProject, setSelectedProject] = React.useState<string>('');
  const [descriptionUrl, setDescriptionUrl] = React.useState<string>('');
  const [loading, setLoading] = React.useState<boolean>(false);
  const router = useRouter();

  React.useEffect(() => {
    fetch(`${API_BASE}/data-commons/structure`)
      .then(res => res.json())
      .then(data => setStructure(data));
  }, []);

  const groupObj = structure.find(g => g.name === selectedGroup);
  const programs =
    groupObj?.programs.filter(p =>
      p.projects.some(prj => prj.studies.some(study => study.hasData && study.files.length > 0)),
    ) || [];

  const programObj = programs.find(p => p.name === selectedProgram);
  const projects =
    programObj?.projects.filter(prj => prj.studies.some(study => study.hasData && study.files.length > 0)) || [];

  React.useEffect(() => {
    if (selectedGroup && selectedProgram && selectedProject) {
      setLoading(true);
      fetch(
        `${API_BASE}/data-commons/project/${encodeURIComponent(selectedGroup)}/${encodeURIComponent(selectedProgram)}/${encodeURIComponent(selectedProject)}/file-status`,
      )
        .then(res => res.json())
        .then(status => {
          if (status['project_description.png']) {
            setDescriptionUrl(
              `${API_BASE}/data-commons/project/${encodeURIComponent(selectedGroup)}/${encodeURIComponent(selectedProgram)}/${encodeURIComponent(selectedProject)}/description`,
            );
          } else {
            setDescriptionUrl('');
          }
        })
        .finally(() => setLoading(false));
    } else {
      setDescriptionUrl('');
    }
  }, [selectedGroup, selectedProgram, selectedProject]);

  const handleGoToPlots = () => {
    if (selectedGroup && selectedProgram && selectedProject) {
      router.push(
        `/data?group=${encodeURIComponent(selectedGroup)}&program=${encodeURIComponent(selectedProgram)}&project=${encodeURIComponent(selectedProject)}`,
      );
    }
  };

  return (
    <div className='w-full border rounded-lg shadow-md h-full'>
      <h2
        style={{
          background: 'linear-gradient(45deg, rgba(18,76,103,1) 0%, rgba(9,114,121,1) 35%, rgba(0,0,0,1) 100%)',
        }}
        className='text-2xl text-white rounded-t-lg font-semibold px-6 py-2 mb-6'
      >
        A Centralized Data Commons of Multi-Omics Data for Exploratory Research
      </h2>
      <div className='px-8 pt-4 pb-2 text-base text-gray-700'>
        <p>
          This section allows you to explore and visualize multi-omics data. Select a group, program, and project to
          view available data and project description.
        </p>
      </div>
      <form className='space-y-6 px-8 py-8'>
        <div>
          <Label htmlFor='group'>Select Group</Label>
          <Select
            value={selectedGroup}
            onValueChange={val => {
              setSelectedGroup(val);
              setSelectedProgram('');
              setSelectedProject('');
            }}
          >
            <SelectTrigger id='group'>
              <SelectValue placeholder='Select group' />
            </SelectTrigger>
            <SelectContent>
              {structure
                .filter(g =>
                  g.programs.some(p =>
                    p.projects.some(prj => prj.studies.some(study => study.hasData && study.files.length > 0)),
                  ),
                )
                .map(group => (
                  <SelectItem key={group.name} value={group.name}>
                    {group.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        {selectedGroup && (
          <div>
            <Label htmlFor='program'>Select Program</Label>
            <Select
              value={selectedProgram}
              onValueChange={val => {
                setSelectedProgram(val);
                setSelectedProject('');
              }}
            >
              <SelectTrigger id='program'>
                <SelectValue placeholder='Select program' />
              </SelectTrigger>
              <SelectContent>
                {programs.map(program => (
                  <SelectItem key={program.name} value={program.name}>
                    {program.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {selectedProgram && (
          <div>
            <Label htmlFor='project'>Select Project</Label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger id='project'>
                <SelectValue placeholder='Select project' />
              </SelectTrigger>
              <SelectContent>
                {projects.map(project => (
                  <SelectItem key={project.name} value={project.name}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </form>
      {selectedGroup && selectedProgram && selectedProject && (
        <div className='px-8 pb-4'>
          <Button
            type='button'
            className='w-full'
            style={{
              background: 'linear-gradient(45deg, rgba(18,76,103,1) 0%, rgba(9,114,121,1) 35%, rgba(0,0,0,1) 100%)',
            }}
            onClick={handleGoToPlots}
          >
            Go to Plots
          </Button>
        </div>
      )}
      {loading && <div className='px-8 pb-4'>Loading project description...</div>}
      {descriptionUrl && (
        <div className='px-8 pb-8'>
          <Label>Project Description</Label>
          <div
            className='mt-2 rounded border shadow'
            style={{ maxWidth: '100%', maxHeight: 400, position: 'relative', width: '100%', height: 400 }}
          >
            <Image
              src={descriptionUrl}
              alt='Project Description'
              fill
              style={{ objectFit: 'contain' }}
              sizes='(max-width: 800px) 100vw, 800px'
            />
          </div>
        </div>
      )}
    </div>
  );
}
