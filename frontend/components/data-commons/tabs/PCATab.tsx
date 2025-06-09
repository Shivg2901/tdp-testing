import PCA from '@/components/data-commons/PCA';

export function PCATab({
  files,
  getFileUrl,
}: {
  files: Record<string, boolean | string[]>;
  getFileUrl: (filename: string) => string;
}) {
  const samplesheetKey = Object.keys(files).find(key => key.toLowerCase().includes('sample'));
  const pcaKey = Object.keys(files).find(key => key.toLowerCase().includes('pca'));

  return (
    <PCA
      samplesheetUrl={samplesheetKey ? getFileUrl(samplesheetKey) : undefined}
      pcaUrl={pcaKey ? getFileUrl(pcaKey) : undefined}
    />
  );
}
