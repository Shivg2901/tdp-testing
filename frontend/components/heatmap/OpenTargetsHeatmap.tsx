'use client';

import { type TargetDiseaseAssociationRow, associationColumns, prioritizationColumns } from '@/lib/data';
import { OPENTARGET_HEATMAP_QUERY } from '@/lib/gql';
import { useStore } from '@/lib/hooks';
import { type OpenTargetsTableData, type OpenTargetsTableVariables, OrderByEnum } from '@/lib/interface';
import { type EventMessage, Events, eventEmitter, orderByStringToEnum } from '@/lib/utils';
import { useQuery } from '@apollo/client';
import type { CheckedState } from '@radix-ui/react-checkbox';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { VirtualizedCombobox } from '../VirtualizedCombobox';
import { AssociationScoreLegend, PrioritizationIndicatorLegend } from '../legends';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { HeatmapTable } from './HeatmapTable';
import { assocColorScale, prioritizationColorScale } from './colorScales';

export function OpenTargetsHeatmap() {
  const geneNames = useStore(state => state.geneNames);
  const geneNameToID = useStore(state => state.geneNameToID);

  const geneIds = useMemo(() => {
    return geneNames.map(g => geneNameToID.get(g) ?? g);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geneNames]);

  const diseaseId = useStore(state => state.diseaseName);
  const [geneIdsToQuery, setGeneIdsToQuery] = useState<string[]>([]);
  const [sortingColumn, setSortingColumn] = useState<string>('Association Score');
  const [pagination, setPagination] = useState({ page: 1, limit: 25 });
  const [selectedGeneNames, setSelectedGeneNames] = useState<Set<string>>(new Set());

  const stableGeneIds = useMemo(() => [...geneIds].sort(), [geneIds]);
  const variables = useMemo<OpenTargetsTableVariables>(() => {
    return {
      geneIds: geneIdsToQuery.length ? geneIdsToQuery : stableGeneIds,
      diseaseId,
      orderBy: orderByStringToEnum(sortingColumn) || OrderByEnum.SCORE,
      page: pagination,
    };
  }, [geneIdsToQuery, stableGeneIds, diseaseId, sortingColumn, pagination]);

  const {
    data: queryData,
    previousData,
    loading,
    error,
    refetch,
  } = useQuery<OpenTargetsTableData, OpenTargetsTableVariables>(OPENTARGET_HEATMAP_QUERY, {
    variables,
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: true,
    returnPartialData: true,
    skip: !diseaseId || stableGeneIds.length === 0,
  });

  const totalCount = (queryData ?? previousData)?.targetDiseaseAssociationTable.totalCount ?? 0;
  const maxPage = Math.max(1, Math.ceil(totalCount / pagination.limit));

  if (error) console.error('Error fetching OpenTargets heatmap data:', error);

  const tableData: TargetDiseaseAssociationRow[] = (
    (queryData ?? previousData)?.targetDiseaseAssociationTable.rows ?? []
  ).map(row => {
    const prioritization: Record<string, number> = {};
    if (Array.isArray(row.target.prioritization)) {
      for (const item of row.target.prioritization) {
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
      'Association Score': row.overall_score,
      ...datasources,
      ...prioritization,
    };
  });

  const toggleOnlyVisible = (checked: CheckedState) => {
    if (checked !== true) {
      const nextGeneIdsToQuery = selectedGeneNames.size
        ? Array.from(selectedGeneNames)
            .reduce<string[]>((acc, geneId) => {
              const id = geneNameToID.get(geneId);
              if (id) acc.push(id);
              return acc;
            }, [])
            .sort()
        : stableGeneIds;
      setGeneIdsToQuery(nextGeneIdsToQuery);
      refetch({
        geneIds: nextGeneIdsToQuery,
        diseaseId,
        orderBy: orderByStringToEnum(sortingColumn ?? 'Association Score') || OrderByEnum.SCORE,
        page: pagination,
      });
    } else {
      eventEmitter.emit(Events.VISIBLE_NODES);
    }
  };

  const handleSearchSelection = (value: Set<string>) => {
    setSelectedGeneNames(value);
    const tmpGeneIdsToQuery = value.size
      ? Array.from(value)
          .reduce<string[]>((acc, geneId) => {
            const id = geneNameToID.get(geneId);
            if (id) acc.push(id);
            return acc;
          }, [])
          .sort()
      : stableGeneIds;
    setGeneIdsToQuery(value.size ? tmpGeneIdsToQuery : []);
    refetch({
      geneIds: tmpGeneIdsToQuery,
      diseaseId,
      orderBy: orderByStringToEnum(sortingColumn ?? 'Association Score') || OrderByEnum.SCORE,
      page: pagination,
    });
  };

  const handlePaginationChange = (next: { page: number; limit: number }) => {
    setPagination(next);
    refetch({
      geneIds: geneIdsToQuery.length ? geneIdsToQuery : stableGeneIds,
      diseaseId,
      orderBy: orderByStringToEnum(sortingColumn) || OrderByEnum.SCORE,
      page: next,
    });
  };

  const handleSortingChange = (columnId: string) => {
    setSortingColumn(columnId);
    refetch({
      geneIds: geneIdsToQuery.length ? geneIdsToQuery : stableGeneIds,
      diseaseId,
      orderBy: orderByStringToEnum(columnId) || OrderByEnum.SCORE,
      page: pagination,
    });
  };

  useEffect(() => {
    eventEmitter.on(Events.VISIBLE_NODES_RESULTS, (data: EventMessage[Events.VISIBLE_NODES_RESULTS]) => {
      const selectedGeneIds = new Set<string>();
      for (const geneName of selectedGeneNames) {
        const id = geneNameToID.get(geneName);
        if (id) selectedGeneIds.add(id);
      }
      const nextGeneIdsToQuery = Array.from(
        selectedGeneIds.size ? selectedGeneIds.intersection(data.visibleNodeGeneIds) : data.visibleNodeGeneIds,
      ).sort();
      setGeneIdsToQuery(nextGeneIdsToQuery);
      refetch({
        geneIds: nextGeneIdsToQuery,
        diseaseId,
        orderBy: orderByStringToEnum(sortingColumn) || OrderByEnum.SCORE,
        page: pagination,
      });
    });

    return () => {
      eventEmitter.removeAllListeners(Events.VISIBLE_NODES_RESULTS);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diseaseId]);

  return (
    <div className='h-full'>
      <div className='flex items-center gap-4 p-4'>
        <div className='flex text-nowrap font-semibold items-center gap-2'>
          <Checkbox defaultChecked={false} onCheckedChange={toggleOnlyVisible} className='shrink-0' />
          Show only visible
        </div>
        <VirtualizedCombobox
          loading={geneIds.length === 0}
          data={geneNames}
          placeholder='Search genes...'
          value={selectedGeneNames}
          onChange={value => typeof value !== 'string' && handleSearchSelection(value)}
          multiselect
          showSelectedAsChip
          width='full'
          className='w-full'
        />
      </div>
      <Tabs defaultValue='tda' className='flex flex-col items-center px-4'>
        <TabsList className='my-4 w-[95%]'>
          <TabsTrigger className='w-full' value='tda'>
            Target-disease Association
          </TabsTrigger>
          <TabsTrigger className='w-full' value='tpf'>
            Target prioritization factors
          </TabsTrigger>
        </TabsList>
        <TabsContent className='w-full' value='tda'>
          <div className='flex flex-col items-center pr-12'>
            <HeatmapTable
              columns={associationColumns}
              data={tableData}
              sortingColumn={sortingColumn}
              onSortChange={handleSortingChange}
              colorScale={value => assocColorScale(typeof value === 'number' ? value : 0)}
              loading={loading && !(queryData || previousData)}
            />
            <div className='mt-2'>
              <AssociationScoreLegend />
            </div>
          </div>
        </TabsContent>
        <TabsContent className='w-full' value='tpf'>
          <div className='flex flex-col items-center pr-12'>
            <HeatmapTable
              columns={prioritizationColumns}
              data={tableData}
              sortingColumn={sortingColumn}
              onSortChange={handleSortingChange}
              colorScale={(value, columnId) =>
                columnId === 'Association Score'
                  ? assocColorScale(typeof value === 'number' ? value : 0.1)
                  : prioritizationColorScale(typeof value === 'number' ? value : 0.1)
              }
              loading={loading && !(queryData || previousData)}
            />
            <div className='mt-2'>
              <PrioritizationIndicatorLegend />
            </div>
          </div>
        </TabsContent>
      </Tabs>
      {/* Pagination controls */}
      <div className='flex flex-col items-center w-full mt-2 gap-2'>
        <div className='flex items-center justify-center gap-2 w-full'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => handlePaginationChange({ ...pagination, page: Math.max(pagination.page - 1, 1) })}
            disabled={pagination.page === 1 || !geneNames.length}
          >
            <ChevronLeftIcon size={18} />
          </Button>
          <span className='text-sm'>
            Page {pagination.page} of {maxPage}
          </span>
          <Button
            variant='outline'
            size='sm'
            onClick={() => handlePaginationChange({ ...pagination, page: Math.min(pagination.page + 1, maxPage) })}
            disabled={pagination.page >= maxPage || !geneNames.length}
          >
            <ChevronRightIcon size={18} />
          </Button>
          <div className='ml-2'>
            <Select
              defaultValue='25'
              onValueChange={value => handlePaginationChange({ page: 1, limit: Number.parseInt(value, 10) })}
            >
              <SelectTrigger className='w-[110px]'>
                <SelectValue placeholder='Page size' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='10'>Show 10</SelectItem>
                <SelectItem value='25'>Show 25</SelectItem>
                <SelectItem value='100'>Show 100</SelectItem>
                <SelectItem value='500'>Show 500</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
