import TranscriptExpression from '@/components/data-commons/TranscriptExpression';

export function TranscriptTab({
  geneFile,
  transcriptFile,
  getFileUrl,
}: {
  geneFile: string | null | undefined;
  transcriptFile: string | null | undefined;
  getFileUrl: (filename: string) => string;
}) {
  return (
    <TranscriptExpression
      samplesheetUrl={getFileUrl('samplesheet.valid.csv')}
      geneCountsUrl={geneFile ? getFileUrl(geneFile) : undefined}
      transcriptCountsUrl={transcriptFile ? getFileUrl(transcriptFile) : undefined}
    />
  );
}
