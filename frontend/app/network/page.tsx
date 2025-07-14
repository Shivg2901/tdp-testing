'use client';

import PCA from '@/components/data-commons/PCA';
import TranscriptExpression from '@/components/data-commons/TranscriptExpression';
import VolcanoPlot from '@/components/data-commons/VolcanoPlot';
import { Spinner } from '@/components/ui/spinner';
import { DEFAULT_EDGE_COLOR } from '@/lib/data';
import '@react-sigma/core/lib/style.css';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

const SigmaContainer = dynamic(() => import('@/components/graph').then(module => module.SigmaContainer), {
  loading: () => (
    <div className='w-full h-full grid place-items-center'>
      <div className='flex flex-col items-center'>
        <Spinner />
        Loading...
      </div>
    </div>
  ),
  ssr: false,
});

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
          {activeTab === 'transcript' && (
            <TranscriptExpression
              samplesheetUrl={files['samplesheet.valid.csv'] ? getFileUrl('samplesheet.valid.csv') : undefined}
              geneCountsUrl={
                files['salmon.merged.gene_counts.tsv'] ? getFileUrl('salmon.merged.gene_counts.tsv') : undefined
              }
              transcriptCountsUrl={
                files['salmon.merged.transcript_counts.tsv']
                  ? getFileUrl('salmon.merged.transcript_counts.tsv')
                  : undefined
              }
            />
          )}
          {activeTab === 'pca' && (
            <PCA
              samplesheetUrl={files['samplesheet.valid.csv'] ? getFileUrl('samplesheet.valid.csv') : undefined}
              pcaUrl={files['PCA.csv'] ? getFileUrl('PCA.csv') : undefined}
            />
          )}
          {activeTab === 'de' && <VolcanoPlot deFiles={deFiles} />}
        </div>
      </div>
    </div>
  );
}

export default function NetworkPage() {
  const searchParams = useSearchParams();
  const isPDCS = searchParams?.get('pdcs') === '1';
  const group = searchParams?.get('group');
  const program = searchParams?.get('program');
  const project = searchParams?.get('project');

  if (isPDCS || (group && program && project)) {
    return <PDCSNetworkTabs />;
  }
  return (
    <SigmaContainer
      className='w-full h-full'
      settings={{
        enableEdgeEvents: true,
        defaultNodeType: 'circle',
        labelRenderedSizeThreshold: 0.75,
        labelDensity: 0.2,
        defaultEdgeColor: DEFAULT_EDGE_COLOR,
        labelSize: 10,
        defaultNodeColor: 'skyblue',
        zoomingRatio: 1.2,
        zIndex: true,
      }}
    />
  );
}
