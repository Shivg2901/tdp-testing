'use client';

import { TranscriptTab } from '@/components/data-commons/tabs/TranscriptTab';
import { PCATab } from '@/components/data-commons/tabs/PCATab';
import { DETab } from '@/components/data-commons/tabs/DETab';
import '@react-sigma/core/lib/style.css';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

function PDCSNetworkTabs() {
  const tabNames = [
    { key: 'transcript', label: 'Transcript-level expression' },
    { key: 'pca', label: 'PCA analysis' },
    { key: 'de', label: 'Differential expression analysis' },
  ];
  const [activeTab, setActiveTab] = React.useState(tabNames[0].key);

  const searchParams = useSearchParams();
  const group = searchParams?.get('group');
  const program = searchParams?.get('program');
  const project = searchParams?.get('project');
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

  const [files, setFiles] = useState<Record<string, boolean | string[]>>({});
  const [deFiles, setDeFiles] = useState<Record<string, string>>({});

  useEffect(() => {
    if (group && program && project) {
      fetch(
        `${API_BASE}/data-commons/project/${encodeURIComponent(group)}/${encodeURIComponent(program)}/${encodeURIComponent(project)}/file-status`,
      )
        .then(res => res.json())
        .then(status => setFiles(status));

      fetch(
        `${API_BASE}/data-commons/project/${encodeURIComponent(group)}/${encodeURIComponent(program)}/${encodeURIComponent(project)}/files/DifferentialExpression`,
      )
        .then(res => res.json())
        .then(data => setDeFiles(data));
    }
  }, [group, program, project, API_BASE]);

  const getFileUrl = (filename: string) =>
    `${API_BASE}/data-commons/project/${encodeURIComponent(group ?? '')}/${encodeURIComponent(program ?? '')}/${encodeURIComponent(project ?? '')}/files/${encodeURIComponent(filename)}`;

  return (
    <div className='w-full h-full flex flex-col'>
      <div className='flex border-b w-full'>
        {tabNames.map(tab => (
          <button
            key={tab.key}
            className={`flex-1 px-6 py-3 font-semibold text-center transition-colors duration-150
              ${
                activeTab === tab.key
                  ? 'border-b-2 border-primary text-primary bg-primary/10'
                  : 'text-muted-foreground hover:bg-muted/50'
              }
            `}
            onClick={() => setActiveTab(tab.key)}
            style={{ minWidth: 0 }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className='flex-1 p-6'>
        <div className='mt-4'>
          {activeTab === 'transcript' && <TranscriptTab files={files} getFileUrl={getFileUrl} />}
          {activeTab === 'pca' && <PCATab files={files} getFileUrl={getFileUrl} />}
          {activeTab === 'de' && <DETab deFiles={deFiles} />}
        </div>
      </div>
    </div>
  );
}

export default function NetworkPage() {
  return <PDCSNetworkTabs />;
}
