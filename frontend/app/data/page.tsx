'use client';

import dynamic from 'next/dynamic';
import '@react-sigma/core/lib/style.css';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
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
  const deFilesParam = searchParams?.get('deFiles');
  const samplesheetFileFromUrl = searchParams?.get('samplesheetFile');
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

  const deFilesSelected = deFilesParam ? deFilesParam.split(',').filter(Boolean) : [];

  const [, setGeneFileContent] = useState<string | null>(null);
  const [, setTranscriptFileContent] = useState<string | null>(null);
  const [, setPcaFileContent] = useState<string | null>(null);
  const [deFilesContent, setDeFilesContent] = useState<Record<string, string>>({});
  const [samplesheetFileName, setSamplesheetFileName] = useState<string | null>(samplesheetFileFromUrl ?? null);
  const [, setSamplesheetFileContent] = useState<string | null>(null);

  const getFileUrl = (filename: string) =>
    `${API_BASE}/data-commons/project/${encodeURIComponent(group ?? '')}/${encodeURIComponent(program ?? '')}/${encodeURIComponent(project ?? '')}/files/${encodeURIComponent(filename)}`;

  useEffect(() => {
    if (group && program && project) {
      if (geneFile) {
        fetch(getFileUrl(geneFile))
          .then(res => res.text())
          .then(data => setGeneFileContent(data))
          .catch(() => setGeneFileContent(null));
      } else {
        setGeneFileContent(null);
      }
      if (transcriptFile) {
        fetch(getFileUrl(transcriptFile))
          .then(res => res.text())
          .then(data => setTranscriptFileContent(data))
          .catch(() => setTranscriptFileContent(null));
      } else {
        setTranscriptFileContent(null);
      }
      if (pcaFile) {
        fetch(getFileUrl(pcaFile))
          .then(res => res.text())
          .then(data => setPcaFileContent(data))
          .catch(() => setPcaFileContent(null));
      } else {
        setPcaFileContent(null);
      }
      if (samplesheetFileFromUrl) {
        setSamplesheetFileName(samplesheetFileFromUrl);
        fetch(getFileUrl(samplesheetFileFromUrl))
          .then(res => res.text())
          .then(data => setSamplesheetFileContent(data))
          .catch(() => setSamplesheetFileContent(null));
      } else {
        fetch(
          `${API_BASE}/data-commons/project/${encodeURIComponent(group)}/${encodeURIComponent(program)}/${encodeURIComponent(project)}/files/keys/samplesheet`,
        )
          .then(res => res.json())
          .then(data => {
            const file =
              Array.isArray(data.filesHavingSameKey) && data.filesHavingSameKey.length > 0
                ? data.filesHavingSameKey[0]
                : '';
            if (file) {
              setSamplesheetFileName(file);
              fetch(getFileUrl(file))
                .then(res => res.text())
                .then(text => setSamplesheetFileContent(text))
                .catch(() => setSamplesheetFileContent(null));
            } else {
              setSamplesheetFileName(null);
              setSamplesheetFileContent(null);
            }
          })
          .catch(() => {
            setSamplesheetFileName(null);
            setSamplesheetFileContent(null);
          });
      }
      if (deFilesSelected.length > 0) {
        Promise.all(
          deFilesSelected.map(file =>
            fetch(getFileUrl(file))
              .then(res => res.text())
              .then(data => [file, data])
              .catch(() => [file, null]),
          ),
        ).then(results => {
          const contentObj: Record<string, string> = {};
          results.forEach(([file, data]) => {
            if (file) contentObj[file as string] = data as string;
          });
          setDeFilesContent(contentObj);
        });
      } else {
        setDeFilesContent({});
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group, program, project, geneFile, transcriptFile, pcaFile, samplesheetFileFromUrl, deFilesParam, API_BASE]);

  const transcriptTabFiles: Record<string, boolean | string[]> = {};
  if (samplesheetFileName) transcriptTabFiles[samplesheetFileName] = true;
  if (geneFile) transcriptTabFiles[geneFile] = true;
  if (transcriptFile) transcriptTabFiles[transcriptFile] = true;

  const pcaTabFiles: Record<string, boolean | string[]> = {};
  if (samplesheetFileName) pcaTabFiles[samplesheetFileName] = true;
  if (pcaFile) pcaTabFiles[pcaFile] = true;

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
          {activeTab === 'transcript' && <TranscriptTab files={transcriptTabFiles} getFileUrl={getFileUrl} />}
          {activeTab === 'pca' && <PCATab files={pcaTabFiles} getFileUrl={getFileUrl} />}
          {activeTab === 'de' && (
            <DETab fileNames={deFilesSelected} filesContent={deFilesContent} getFileUrl={getFileUrl} />
          )}
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
