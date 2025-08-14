'use client';

import { DiseaseMapCombobox } from '@/components/DiseaseMapCombobox';
import History, { type HistoryItem } from '@/components/History';
import PopUpTable from '@/components/PopUpTable';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MultiSelect } from '@/components/ui/multiselect';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { graphConfig } from '@/lib/data';
import { GENE_VERIFICATION_QUERY, TOP_GENES_QUERY } from '@/lib/gql';
import type { GeneVerificationData, GeneVerificationVariables, GetDiseaseData, GraphConfigForm } from '@/lib/interface';
import { distinct, envURL } from '@/lib/utils';
import { useLazyQuery } from '@apollo/client';
import { AlertTriangle, Info, Loader } from 'lucide-react';
import React, { type ChangeEvent } from 'react';
import { toast } from 'sonner';

export default function Home() {
  const [verifyGenes, { data, loading }] = useLazyQuery<GeneVerificationData, GeneVerificationVariables>(
    GENE_VERIFICATION_QUERY,
  );
  const [diseaseData, setDiseaseData] = React.useState<GetDiseaseData | undefined>(undefined);

  const [fetchTopGenes, { data: topGenesData, loading: topGenesLoading }] = useLazyQuery(TOP_GENES_QUERY);

  React.useEffect(() => {
    (async () => {
      const response = await fetch(`${envURL(process.env.NEXT_PUBLIC_BACKEND_URL)}/diseases`);
      const data = await response.json();
      setDiseaseData(data);
    })();
  }, []);

  const [formData, setFormData] = React.useState<GraphConfigForm>({
    seedGenes: 'MAPT, STX6, EIF2AK3, MOBP, DCTN1, LRRK2',
    diseaseMap: 'MONDO_0004976',
    order: '0',
    interactionType: ['PPI'],
    minScore: '0.9',
  });

  const [history, setHistory] = React.useState<HistoryItem[]>([]);

  React.useEffect(() => {
    setHistory(JSON.parse(localStorage.getItem('history') ?? '[]'));
  }, []);

  React.useEffect(() => {
    const escapeListener = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setTableOpen(false);
      }
    };
    document.addEventListener('keydown', escapeListener);
    return () => {
      document.removeEventListener('keydown', escapeListener);
    };
  }, []);

  const [tableOpen, setTableOpen] = React.useState(false);
  const [geneIDs, setGeneIDs] = React.useState<string[]>([]);
  const [showAlert, setShowAlert] = React.useState(false);

  const [autofill, setAutofill] = React.useState(false);
  const [autofillLoading, setAutofillLoading] = React.useState(false);

  const handleAutofill = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!autofill) return;
    const fd = new FormData(e.currentTarget);
    const num = Number.parseInt(fd.get('autofill-num') as string, 10);
    setAutofillLoading(true);
    try {
      await fetchTopGenes({
        variables: {
          diseaseId: formData.diseaseMap,
          limit: num,
        },
      });
    } catch {
      toast.error('Failed to autofill genes from API', {
        cancel: { label: 'Close', onClick() {} },
      });
    } finally {
      setAutofillLoading(false);
    }
  };

  React.useEffect(() => {
    if (topGenesData?.topGenesByDisease) {
      const genes: string[] = topGenesData.topGenesByDisease.map((g: { gene_name: string }) => g.gene_name);
      setFormData(f => ({ ...f, seedGenes: genes.join(', ') }));
      setAutofillLoading(false);
    }
  }, [topGenesData]);

  const handleSubmit = async () => {
    const { seedGenes } = formData;
    const geneIDs = distinct(seedGenes.split(/[,|\n]/).map(gene => gene.trim().toUpperCase())).filter(Boolean);
    setGeneIDs(geneIDs);
    const { error } = await verifyGenes({
      variables: { geneIDs },
    });
    if (error) {
      console.error(error);
      toast.error('Error fetching data', {
        cancel: { label: 'Close', onClick() {} },
        description: 'Server not available,Please try again later',
      });
      return;
    }
    setTableOpen(true);
  };

  const handleSelect = (val: string, key: string) => {
    setFormData({ ...formData, [key]: val });
  };
  const handleMultiSelect = (vals: string[], key: string) => {
    setFormData({ ...formData, [key]: vals });
  };

  const handleFileRead = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file?.type !== 'text/plain') {
      toast.error('Invalid file type', {
        cancel: { label: 'Close', onClick() {} },
      });
      return;
    }
    const text = await file?.text();
    if (text) {
      setFormData({ ...formData, seedGenes: text });
    } else {
      toast.error('Error reading file', {
        cancel: { label: 'Close', onClick() {} },
      });
    }
  };

  const handleSeedGenesChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({ ...formData, seedGenes: event.target.value });
    if (autofill) setAutofill(false);
  };

  const handleGenerateGraph = (skipWarning = false) => {
    if (!skipWarning) {
      const seedCount = data?.genes.length ?? 0;
      const orderNum = +formData.order;
      const maxGenes = orderNum === 0 ? 5000 : 50;
      const warningThreshold = orderNum === 0 ? 1000 : 25;

      if (seedCount > maxGenes) {
        toast.error('Too many seed genes', {
          description: `Maximum ${maxGenes} genes allowed for ${
            orderNum === 0 ? 'zero' : 'first/second'
          } order networks`,
          cancel: { label: 'Close', onClick() {} },
        });
        return;
      }

      if (seedCount > warningThreshold) {
        setShowAlert(true);
        return;
      }
    }
    const seedGenes = data?.genes.map(gene => gene.ID);
    if (!seedGenes) {
      toast.error('There is no valid gene in the list', {
        cancel: { label: 'Close', onClick() {} },
        description: 'Please enter valid gene names',
      });
      return;
    }

    const newHistory = [
      {
        title: `Graph: ${history.length + 1}`,
        geneIDs: seedGenes,
        ...formData,
      },
      ...history,
    ];
    setHistory(newHistory);
    localStorage.setItem('history', JSON.stringify(newHistory));

    localStorage.setItem(
      'graphConfig',
      JSON.stringify({
        geneIDs: seedGenes,
        diseaseMap: formData.diseaseMap,
        order: +formData.order,
        interactionType: formData.interactionType,
        minScore: +formData.minScore,
        createdAt: Date.now(),
      }),
    );
    setTableOpen(false);
    window.open('/network', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className='mx-auto rounded-lg shadow-md border min-h-[80vh]'>
      <h2
        style={{
          background: 'linear-gradient(45deg, rgba(18,76,103,1) 0%, rgba(9,114,121,1) 35%, rgba(0,0,0,1) 100%)',
        }}
        className='text-2xl text-white rounded-t-lg font-semibold px-6 py-2 mb-6'
      >
        Search by Multiple Proteins
      </h2>
      <ResizablePanelGroup direction='horizontal' className='gap-4 p-4'>
        <ResizablePanel defaultSize={75} minSize={65}>
          <div className='space-y-4'>
            <div className='flex flex-col sm:flex-row sm:items-center h-8 gap-2 mb-2'>
              <div className='flex items-center gap-2'></div>
              <Switch checked={autofill} onCheckedChange={setAutofill} id='autofill-toggle' />
              <Label htmlFor='autofill-toggle' className='whitespace-nowrap'>
                Autofill Seed Genes
              </Label>
              <span className='flex items-center'>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info size={12} />
                  </TooltipTrigger>
                  <TooltipContent className='max-w-s'>
                    <div>
                      <div>
                        <b>Autofills</b> the seed genes box with the top <b>n</b> genes for the selected disease.
                      </div>
                      <div>Genes are ranked by overall association score from the OpenTargets platform.</div>
                      <div>
                        <b>Note:</b> Autofill uses only one type of gene identifier as returned by the API.
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </span>
              <div className='flex items-center gap-2'></div>
              {autofill && (
                <form onSubmit={handleAutofill} className='flex items-center gap-2 sm:ml-4'>
                  <Label htmlFor='autofill-num'>No. of genes</Label>
                  <Input
                    id='autofill-num'
                    type='number'
                    inputMode='numeric'
                    required
                    name='autofill-num'
                    min={1}
                    className='w-20 h-8'
                    placeholder='e.g. 25'
                    defaultValue={25}
                    disabled={autofillLoading || topGenesLoading}
                  />
                  <Button
                    type='submit'
                    disabled={autofillLoading || topGenesLoading}
                    className='ml-2 h-8'
                    style={{
                      background:
                        'linear-gradient(45deg, rgba(18,76,103,1) 0%, rgba(9,114,121,1) 35%, rgba(0,0,0,1) 100%)',
                    }}
                  >
                    {autofillLoading || topGenesLoading ? (
                      <>
                        <Loader className='animate-spin mr-2' size={16} />
                        Autofilling...
                      </>
                    ) : (
                      'Autofill'
                    )}
                  </Button>
                </form>
              )}
            </div>
            <div>
              <div className='flex justify-between'>
                <Label htmlFor='seedGenes'>Seed Genes</Label>
                <p className='text-zinc-500'>
                  (one-per-line or CSV; examples:
                  <span
                    className='underline cursor-pointer'
                    onClick={() => {
                      setFormData({
                        ...formData,
                        seedGenes: 'MAPT, STX6, EIF2AK3, MOBP, DCTN1, LRRK2',
                      });
                    }}
                  >
                    #1
                  </span>{' '}
                  <span
                    className='underline cursor-pointer'
                    onClick={() => {
                      setFormData({
                        ...formData,
                        seedGenes: `ENSG00000122359
ENSG00000100823
ENSG00000214944
ENSG00000172995
ENSG00000147894
ENSG00000162063`,
                      });
                    }}
                  >
                    #2
                  </span>{' '}
                  <span
                    className='underline cursor-pointer'
                    onClick={() => {
                      setFormData({
                        ...formData,
                        seedGenes: `DCTN1
DNAJC7
ERBB4
ERLIN1
EWSR1
FIG4`,
                      });
                    }}
                  >
                    #3
                  </span>
                  )
                </p>
              </div>
              <Textarea
                rows={6}
                id='seedGenes'
                placeholder='Type seed genes in either , or new line separated format'
                className='mt-1'
                value={formData.seedGenes}
                onChange={handleSeedGenesChange}
                required
                disabled={autofillLoading}
              />
              <center>OR</center>
              <Label htmlFor='seedFile'>Upload Text File</Label>
              <Input
                id='seedFile'
                type='file'
                accept='.txt'
                className='border-2 hover:border-dashed cursor-pointer h-9'
                onChange={handleFileRead}
                disabled={autofillLoading}
              />
            </div>
            <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
              <div className='space-y-1'>
                <div className='flex items-end gap-1'>
                  <Label htmlFor='diseaseMap'>Disease Map</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info size={12} />
                    </TooltipTrigger>
                    <TooltipContent>
                      Contains the disease name to be mapped taken from OpenTargets Portal. <br />
                      <b>Note:</b> To search disease using its ID, type disease ID in parentheses.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <DiseaseMapCombobox
                  data={diseaseData}
                  value={formData.diseaseMap}
                  onChange={val => typeof val === 'string' && handleSelect(val, 'diseaseMap')}
                  className='w-full'
                />
              </div>
              {graphConfig.map(config => (
                <div key={config.id} className='space-y-1'>
                  <div className='flex items-end gap-1'>
                    <Label htmlFor={config.id}>{config.name}</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info size={12} />
                      </TooltipTrigger>
                      <TooltipContent>{config.tooltipContent}</TooltipContent>
                    </Tooltip>
                  </div>
                  {config.id === 'interactionType' ? (
                    <MultiSelect
                      options={[...config.options]}
                      selectedValues={formData[config.id] || []}
                      onChange={values => handleMultiSelect(values, config.id)}
                      placeholder='Select...'
                    />
                  ) : (
                    <Select required value={formData[config.id]} onValueChange={val => handleSelect(val, config.id)}>
                      <SelectTrigger id={config.id}>
                        <SelectValue placeholder='Select...' />
                      </SelectTrigger>
                      <SelectContent>
                        {config.options.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              ))}
            </div>
            <center>
              <Button
                type='submit'
                onClick={handleSubmit}
                style={{
                  background: 'linear-gradient(45deg, rgba(18,76,103,1) 0%, rgba(9,114,121,1) 35%, rgba(0,0,0,1) 100%)',
                }}
                className='w-3/4 mb-4'
              >
                {loading ? (
                  <>
                    <Loader className='animate-spin mr-2' size={20} />
                    Verifying {geneIDs.length} genes...
                  </>
                ) : (
                  'Submit'
                )}
              </Button>
            </center>
            <PopUpTable
              setTableOpen={setTableOpen}
              tableOpen={tableOpen}
              handleGenerateGraph={handleGenerateGraph}
              data={data}
              geneIDs={geneIDs}
            />
          </div>
          <AlertDialog open={showAlert}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className='text-red-500 flex items-center'>
                  <AlertTriangle size={24} className='mr-2' />
                  Warning!
                </AlertDialogTitle>
                <AlertDialogDescription className='text-black'>
                  You are about to generate a graph with a large number of nodes/edges. This may take a long time to
                  complete.
                </AlertDialogDescription>
                <p className='text-black font-semibold'>Are you sure you want to proceed?</p>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setShowAlert(false)}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    setShowAlert(false);
                    handleGenerateGraph(true);
                    document.body.removeAttribute('style');
                  }}
                >
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </ResizablePanel>
        <ResizableHandle withHandle className='hidden md:flex' />
        <ResizablePanel className='h-[65vh] hidden md:block' defaultSize={25} minSize={15}>
          <History history={history} setHistory={setHistory} setFormData={setFormData} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
