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
  hasData: boolean;
  files: string[];
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
  const [descriptionFiles, setDescriptionFiles] = React.useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState<number>(0);
  const [loading, setLoading] = React.useState<boolean>(false);
  const router = useRouter();

  React.useEffect(() => {
    fetch(`${API_BASE}/data-commons/structure`)
      .then(res => res.json())
      .then(data => setStructure(data));
  }, []);

  const groupObj = structure.find(g => g.name === selectedGroup);
  const programs = groupObj?.programs.filter(p => p.projects.some(prj => prj.hasData && prj.files.length > 0)) || [];

  const programObj = programs.find(p => p.name === selectedProgram);
  const projects = programObj?.projects.filter(prj => prj.hasData && prj.files.length > 0) || [];

  React.useEffect(() => {
    if (selectedGroup && selectedProgram && selectedProject) {
      setLoading(true);
      fetch(
        `${API_BASE}/data-commons/project/${encodeURIComponent(selectedGroup)}/${encodeURIComponent(selectedProgram)}/${encodeURIComponent(selectedProject)}/description`,
      )
        .then(res => {
          if (!res.ok) throw new Error('No description files');
          return res.json();
        })
        .then((result: Record<string, string>) => {
          const files = Object.values(result);
          setDescriptionFiles(files);
          setCurrentIndex(0);
        })
        .catch(() => setDescriptionFiles([]))
        .finally(() => setLoading(false));
    } else {
      setDescriptionFiles([]);
    }
  }, [selectedGroup, selectedProgram, selectedProject]);

  React.useEffect(() => {
    if (descriptionFiles.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(idx => (idx + 1) % descriptionFiles.length);
    }, 3000); // 3 seconds
    return () => clearInterval(interval);
  }, [descriptionFiles]);

  const handlePrev = () => {
    setCurrentIndex(idx => (idx - 1 + descriptionFiles.length) % descriptionFiles.length);
  };

  const handleNext = () => {
    setCurrentIndex(idx => (idx + 1) % descriptionFiles.length);
  };

  const handleGoToPlots = () => {
    if (selectedGroup && selectedProgram && selectedProject) {
      router.push(
        `/data?group=${encodeURIComponent(selectedGroup)}&program=${encodeURIComponent(selectedProgram)}&project=${encodeURIComponent(selectedProject)}`,
      );
    }
  };

  const getImageUrl = (filename: string) =>
    `${API_BASE}/data-commons/project/${encodeURIComponent(selectedGroup)}/${encodeURIComponent(selectedProgram)}/${encodeURIComponent(selectedProject)}/files/${encodeURIComponent(filename)}`;

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
      <form className='px-8 pb-4'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
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
                  .filter(g => g.programs.some(p => p.projects.some(prj => prj.hasData && prj.files.length > 0)))
                  .map(group => (
                    <SelectItem key={group.name} value={group.name}>
                      {group.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor='program'>Select Program</Label>
            <Select
              value={selectedProgram}
              onValueChange={val => {
                setSelectedProgram(val);
                setSelectedProject('');
              }}
              disabled={!selectedGroup}
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

          <div>
            <Label htmlFor='project'>Select Project</Label>
            <Select value={selectedProject} onValueChange={setSelectedProject} disabled={!selectedProgram}>
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
        </div>
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
      {descriptionFiles.length > 0 && (
        <div className='px-8 pb-8'>
          <div
            className='mt-2 flex flex-col items-center'
            style={{
              maxWidth: '100%',
              width: '100%',
              height: 'calc(100vh - 400px)', // Dynamic height based on viewport minus space for form/header
              minHeight: '500px', // Minimum height to ensure good visibility
              maxHeight: '700px', // Maximum height to prevent excessive growth
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '100%',
              }}
            >
              <Image
                src={getImageUrl(descriptionFiles[currentIndex]) || '/placeholder.svg'}
                alt={`Project Description`}
                fill
                style={{ objectFit: 'contain' }}
                sizes='100vw'
                priority
              />
              {descriptionFiles.length > 1 && (
                <>
                  <button
                    aria-label='Previous'
                    onClick={handlePrev}
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'rgba(0,0,0,0.4)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: 36,
                      height: 36,
                      cursor: 'pointer',
                      zIndex: 2,
                    }}
                  >
                    &#8592;
                  </button>
                  <button
                    aria-label='Next'
                    onClick={handleNext}
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'rgba(0,0,0,0.4)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: 36,
                      height: 36,
                      cursor: 'pointer',
                      zIndex: 2,
                    }}
                  >
                    &#8594;
                  </button>
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 10,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      display: 'flex',
                      gap: 8,
                    }}
                  >
                    {descriptionFiles.map((_, idx) => (
                      <span
                        key={idx}
                        style={{
                          display: 'inline-block',
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: idx === currentIndex ? '#1976d2' : '#bbb',
                          cursor: 'pointer',
                        }}
                        onClick={() => setCurrentIndex(idx)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
