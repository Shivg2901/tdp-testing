import PCA from '@/components/data-commons/PCA';

export function PCATab({
  files,
  getFileUrl,
}: {
  files: Record<string, boolean | string[]>;
  getFileUrl: (filename: string) => string;
}) {
  return (
    <PCA
      samplesheetUrl={files['samplesheet.valid.csv'] ? getFileUrl('samplesheet.valid.csv') : undefined}
      pcaUrl={files['PCA.csv'] ? getFileUrl('PCA.csv') : undefined}
    />
  );
}
