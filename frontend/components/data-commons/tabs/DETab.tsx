import dynamic from 'next/dynamic';

const VolcanoPlot = dynamic(() => import('@/components/data-commons/VolcanoPlot'), { ssr: false });

export function DETab({
  filesContent,
}: {
  fileNames: string[];
  filesContent: Record<string, string>;
  getFileUrl: (filename: string) => string;
}) {
  return <VolcanoPlot deFiles={filesContent} />;
}
