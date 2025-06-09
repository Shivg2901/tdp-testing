import TranscriptExpression from '@/components/data-commons/TranscriptExpression';

export function TranscriptTab({
  files,
  getFileUrl,
}: {
  files: Record<string, boolean | string[]>;
  getFileUrl: (filename: string) => string;
}) {
  const samplesheetKey = Object.keys(files).find(key => key.toLowerCase().includes('sample'));
  const geneKey = Object.keys(files).find(key => key.toLowerCase().includes('gene'));
  const transcriptKey = Object.keys(files).find(key => key.toLowerCase().includes('transcript'));

  return (
    <TranscriptExpression
      samplesheetUrl={samplesheetKey ? getFileUrl(samplesheetKey) : undefined}
      geneCountsUrl={geneKey ? getFileUrl(geneKey) : undefined}
      transcriptCountsUrl={transcriptKey ? getFileUrl(transcriptKey) : undefined}
    />
  );
}
