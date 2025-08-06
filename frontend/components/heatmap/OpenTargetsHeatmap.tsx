'use client';

import { OPENTARGET_HEATMAP_QUERY } from '@/lib/gql';
import { useStore } from '@/lib/hooks';
import { type OpenTargetsTableData, type OpenTargetsTableVariables, OrderByEnum } from '@/lib/interface';
import { useQuery } from '@apollo/client';
import { useState } from 'react';
import { AssociationScoreLegend, PrioritisationIndicatorLegend } from '../legends';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { HeatmapTable } from './HeatmapTable';
import { assocColorScale, prioritizationColorScale } from './colorScales';
import { data } from '@/mock-data.json';
import type { ColumnDef } from '@tanstack/react-table';

// Types for prioritization and table row
type Prioritization = {
  key: string;
  score: number;
};

type TargetDiseaseAssociationRow = {
  target: string;
  overall_score: number;
  [key: string]: string | number;
};
export function OpenTargetsHeatmap() {
  const geneIds = useStore(state => state.geneIDs);
  const diseaseId = useStore(state => state.diseaseName);
  const [sorting, setSorting] = useState<{ id: string; desc: boolean }[]>([{ id: 'overall_score', desc: true }]);

  const prioritizationKeys: string[] = Array.isArray(data.targetDiseaseAssociationTable[0]?.target.prioritization)
    ? (data.targetDiseaseAssociationTable[0].target.prioritization as Prioritization[]).map(item => item.key)
    : [];

  const datasourceKeys: string[] = [
    'Association Score',
    'GWAS associations',
    'Gene Burden',
    'ClinVar',
    'GEL PanelApp',
    'Gene2phenotype',
    'UniProt literature',
    'UniProt curated variants',
    'Orphanet',
    'ClinGen',
    'Cancer Gene Census',
    'IntOGen',
    'ClinVar (somatic)',
    'Cancer Biomarkers',
    'ChEMBL',
    'CRISPR Screens',
    'Project Score',
    'SLAPenrich',
    'PROGENy',
    'Reactome',
    'Gene signatures',
    'Europe PMC',
    'Expression Atlas',
    'IMPC',
  ];

  const tableData: TargetDiseaseAssociationRow[] = data.targetDiseaseAssociationTable.map(row => {
    const prioritization: Record<string, number> = {};
    if (Array.isArray(row.target.prioritization)) {
      for (const item of row.target.prioritization as Prioritization[]) {
        prioritization[item.key] = item.score;
      }
    }
    const datasources: Record<string, number> = {};
    if (Array.isArray(row.datasourceScores)) {
      for (const item of row.datasourceScores as { key: string; score: number }[]) {
        datasources[item.key] = item.score;
      }
    }
    return {
      target: row.target.name,
      overall_score: row.overall_score,
      ...datasources,
      ...prioritization,
    };
  });

  // Association columns: Target, all datasources, overall_score
  const associationColumns: ColumnDef<TargetDiseaseAssociationRow, string | number | undefined>[] = [
    {
      accessorKey: 'target',
      header: 'Target',
      cell: info => <span className='font-semibold'>{info.getValue()}</span>,
      enableSorting: false,
    },
    {
      accessorKey: 'overall_score',
      header: () => <span className='font-semibold'>Association Score</span>,
      enableSorting: true,
    },
    ...datasourceKeys.map<ColumnDef<TargetDiseaseAssociationRow, string | number | undefined>>(key => ({
      accessorKey: key,
      header: key,
      enableSorting: true,
    })),
  ];

  // Prioritization columns: Target, all prioritization keys
  const prioritizationColumns: ColumnDef<TargetDiseaseAssociationRow, string | number | undefined>[] = [
    {
      accessorKey: 'target',
      header: 'Target',
      cell: info => <span className='font-semibold'>{info.getValue()}</span>,
      enableSorting: false,
    },
    {
      accessorKey: 'overall_score',
      header: 'Association Score',
      enableSorting: true,
    },
    ...prioritizationKeys.map<ColumnDef<TargetDiseaseAssociationRow, string | number | undefined>>(key => ({
      accessorKey: key,
      header: key,
      enableSorting: false,
    })),
  ];

  return (
    <div className='h-full'>
      <Tabs defaultValue='tda' className='flex flex-col items-center h-full px-4'>
        <TabsList className='my-4 w-[95%]'>
          <TabsTrigger className='w-full' value='tda'>
            Target-disease Association
          </TabsTrigger>
          <TabsTrigger className='w-full' value='tpf'>
            Target prioritization factors
          </TabsTrigger>
        </TabsList>
        <TabsContent className='w-full' value='tda'>
          <div className='flex flex-col items-center'>
            <HeatmapTable
              columns={associationColumns}
              data={tableData}
              sorting={sorting}
              onSortChange={setSorting}
              pageSizeOptions={[2, 25, 100]}
              colorScale={value => assocColorScale(typeof value === 'number' ? value : 0)}
            />
            <div className='mt-2'>
              <AssociationScoreLegend />
            </div>
          </div>
        </TabsContent>
        <TabsContent className='w-full' value='tpf'>
          <div className='flex flex-col items-center'>
            <HeatmapTable
              columns={prioritizationColumns}
              data={tableData}
              sorting={sorting}
              onSortChange={setSorting}
              pageSizeOptions={[2, 25, 100]}
              colorScale={(value, columnId) =>
                columnId === 'overall_score'
                  ? assocColorScale(typeof value === 'number' ? value : 0.1)
                  : prioritizationColorScale(typeof value === 'number' ? value : 0.1)
              }
            />
            <div className='mt-2'>
              <PrioritisationIndicatorLegend />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
