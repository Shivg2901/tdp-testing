import TranscriptExpression from '@/components/data-commons/TranscriptExpression';

export function TranscriptTab({
  files,
  getFileUrl,
}: {
  files: Record<string, boolean | string[]>;
  getFileUrl: (filename: string) => string;
}) {
  return (
    <TranscriptExpression
      samplesheetUrl={files['samplesheet.valid.csv'] ? getFileUrl('samplesheet.valid.csv') : undefined}
      geneCountsUrl={files['salmon.merged.gene_counts.tsv'] ? getFileUrl('salmon.merged.gene_counts.tsv') : undefined}
      transcriptCountsUrl={
        files['salmon.merged.transcript_counts.tsv'] ? getFileUrl('salmon.merged.transcript_counts.tsv') : undefined
      }
    />
  );
}
