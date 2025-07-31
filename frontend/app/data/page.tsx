'use client';

import dynamic from 'next/dynamic';
import '@react-sigma/core/lib/style.css';
import { useSearchParams } from 'next/navigation';
import React from 'react';
import { Suspense } from 'react';

const TranscriptTab = dynamic(
  () => import('@/components/data-commons/tabs/TranscriptTab').then(mod => mod.TranscriptTab),
  { ssr: false },
);
const PCATab = dynamic(() => import('@/components/data-commons/tabs/PCATab').then(mod => mod.PCATab), { ssr: false });
const DETab = dynamic(() => import('@/components/data-commons/tabs/DETab').then(mod => mod.DETab), { ssr: false });

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
  const geneFile = searchParams?.get('geneFile');
  const transcriptFile = searchParams?.get('transcriptFile');
  const pcaFile = searchParams?.get('pcaFile');
  const deFile = searchParams?.get('deFiles');
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

  const deFilesArray = deFile?.split(',');

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
          {activeTab === 'transcript' && (
            <TranscriptTab geneFile={geneFile} transcriptFile={transcriptFile} getFileUrl={getFileUrl} />
          )}
          {activeTab === 'pca' && <PCATab pcaFile={pcaFile} getFileUrl={getFileUrl} />}
          {activeTab === 'de' && <DETab deFilesArray={deFilesArray} getFileUrl={getFileUrl} />}
        </div>
      </div>
    </div>
  );
}

export default function NetworkPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PDCSNetworkTabs />
    </Suspense>
  );
}
