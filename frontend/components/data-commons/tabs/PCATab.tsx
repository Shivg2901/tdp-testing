import PCA from '@/components/data-commons/PCA';

export function PCATab({
  pcaFile,
  getFileUrl,
}: {
  pcaFile: string | null | undefined;
  getFileUrl: (filename: string) => string;
}) {
  return (
    <PCA samplesheetUrl={getFileUrl('samplesheet.valid.csv')} pcaUrl={pcaFile ? getFileUrl(pcaFile) : undefined} />
  );
}
