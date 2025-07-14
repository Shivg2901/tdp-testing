import dynamic from 'next/dynamic';

const VolcanoPlot = dynamic(() => import('@/components/data-commons/VolcanoPlot'), { ssr: false });

export function DETab({ deFiles }: { deFiles: Record<string, string> }) {
  return <VolcanoPlot deFiles={deFiles} />;
}
