'use client';
import PopUpTable from '@/components/PopUpTable';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GENE_VERIFICATION_QUERY } from '@/lib/gql';
import type { GeneVerificationData, GeneVerificationVariables } from '@/lib/interface';
import { distinct, openDB } from '@/lib/utils';
import { useLazyQuery } from '@apollo/client';
import { Loader } from 'lucide-react';
import Image from 'next/image';
import React from 'react';
import { toast } from 'sonner';

export default function UploadFile() {
  const [file, setFile] = React.useState<File | null>(null);
  const [fileType, setFileType] = React.useState<'csv' | 'json'>('csv');
  const [csvType, setCsvType] = React.useState<'type1' | 'type2'>('type1');
  const [verifyGenes, setVerifyGenes] = React.useState(true);
  const [fetchData, { data, loading }] = useLazyQuery<GeneVerificationData, GeneVerificationVariables>(
    GENE_VERIFICATION_QUERY,
  );
  const [tableOpen, setTableOpen] = React.useState(false);
  const [geneIDs, setGeneIDs] = React.useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file?.name.split('.').pop() !== fileType) {
      toast.error('Invalid file type', {
        cancel: { label: 'Close', onClick() {} },
        description: `Please upload a ${fileType.toUpperCase()} file`,
      });
      return;
    }
    setFile(file);
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error('Please upload a file', {
        cancel: { label: 'Close', onClick() {} },
      });
      return;
    }
    let distinctSeedGenes: string[] = [];
    if (fileType === 'json') {
      const data = JSON.parse(await file.text());
      distinctSeedGenes = distinct(
        data
          .flatMap((gene: Record<string, string | number>) => {
            return Object.values(gene).filter(val => Number.isNaN(Number(val)));
          })
          .map((gene: string) => gene.trim().toUpperCase()),
      );
    } else {
      const data = await file.text();

      const lines = data.split('\n').filter(Boolean);

      if (csvType == 'type2') {
        const header = lines[0].split(',').map(h => h.trim().toLowerCase());
        const xTypeIdx = header.indexOf('x_type');
        const yTypeIdx = header.indexOf('y_type');
        const xIdIdx = header.indexOf('x_name');
        const yIdIdx = header.indexOf('y_name');

        if (verifyGenes) {
          if (verifyGenes) {
            for (let i = 1; i < lines.length; i++) {
              const cols = lines[i].split(',');
              if (
                (cols[xTypeIdx]?.toLowerCase().includes('gene') || cols[xTypeIdx]?.toLowerCase().includes('protein')) &&
                cols[xIdIdx]
              ) {
                distinctSeedGenes.push(cols[xIdIdx].trim().toUpperCase());
              }
              if (
                (cols[yTypeIdx]?.toLowerCase().includes('protein') || cols[yTypeIdx]?.toLowerCase().includes('gene')) &&
                cols[yIdIdx]
              ) {
                distinctSeedGenes.push(cols[yIdIdx].trim().toUpperCase());
              }
            }
            distinctSeedGenes = distinct(distinctSeedGenes);
          }
        }
      } else {
        distinctSeedGenes = distinct(
          data
            .split('\n')
            .slice(1)
            .flatMap(line => line.split(',').slice(0, 2))
            .map(gene => gene.trim().toUpperCase()),
        );
      }
    }
    if ((csvType === 'type1' || (csvType === 'type2' && verifyGenes)) && distinctSeedGenes.length < 2) {
      toast.error('Please provide at least 2 valid genes', {
        cancel: { label: 'Close', onClick() {} },
        description: 'Seed genes should be either ENSG IDs or gene names',
      });
      return;
    }

    if (csvType === 'type2' && !verifyGenes) {
      setGeneIDs([]);
      setTableOpen(false);
      toast.success('File ready to upload (no gene verification)', {
        cancel: { label: 'Close', onClick() {} },
      });
      //generate
      await handleGenerateGraph();
      return;
    }

    if (distinctSeedGenes.length > 0) {
      const { error } = await fetchData({
        variables: { geneIDs: distinctSeedGenes },
      });
      if (error) {
        console.error(error);
        toast.error('Error fetching data', {
          cancel: { label: 'Close', onClick() {} },
          description: 'Server not available,Please try again later',
        });
        return;
      }
      setGeneIDs(distinctSeedGenes);
      setTableOpen(true);
    }
  };

  const handleGenerateGraph = async () => {
    const store = await openDB('network', 'readwrite');
    if (!store) {
      toast.error('Failed to open IndexedDB database', {
        cancel: { label: 'Close', onClick() {} },
        description: 'Please make sure you have enabled IndexedDB in your browser',
      });
      return;
    }
    store.put(file, file?.name);
    toast.success('File uploaded successfully', {
      cancel: { label: 'Close', onClick() {} },
    });
    const params = new URLSearchParams({
      file: file?.name as string,
      csvType: fileType === 'csv' ? csvType : '',
    });
    window.open(`/network?${params.toString()}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className='mx-auto border rounded-lg shadow-md h-full'>
      <h2
        style={{
          background: 'linear-gradient(45deg, rgba(18,76,103,1) 0%, rgba(9,114,121,1) 35%, rgba(0,0,0,1) 100%)',
        }}
        className='text-2xl text-white rounded-t-lg font-semibold px-6 py-2 mb-6'
      >
        Upload your Network
      </h2>
      <form action={handleSubmit}>
        <div className='space-y-4 px-8'>
          <div>
            <Label htmlFor='fileType'>Select File Type</Label>
            <Select value={fileType} onValueChange={val => setFileType(val as 'csv' | 'json')}>
              <SelectTrigger id='fileType'>
                <SelectValue placeholder='Select file type' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='csv'>CSV</SelectItem>
                <SelectItem value='json'>JSON</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {fileType === 'csv' && (
            <div>
              <Label htmlFor='csvType'>CSV Format</Label>
              <Select value={csvType} onValueChange={val => setCsvType(val as 'type1' | 'type2')}>
                <SelectTrigger id='csvType'>
                  <SelectValue placeholder='Select CSV format' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='type1'>Type 1 (Node1, Node2, Score)</SelectItem>
                  <SelectItem value='type2'>Type 2 (relation,display_relation,x_index,x_id,...)</SelectItem>
                </SelectContent>
              </Select>
              {csvType === 'type2' && (
                <div className='flex items-center mt-2'>
                  <Checkbox
                    id='verifyGenes'
                    checked={verifyGenes}
                    onCheckedChange={checked => setVerifyGenes(!!checked)}
                  />
                  <Label htmlFor='verifyGenes' className='ml-2'>
                    Verify genes/proteins in file?
                  </Label>
                </div>
              )}
            </div>
          )}
          <div>
            <div className='flex justify-between items-center'>
              <Label htmlFor='fileUpload'>Upload {fileType.toUpperCase()}</Label>
              <p className='text-zinc-500 lg:text-base sm:text-sm text-xs'>
                (1st & 2nd columns need to be ENSG IDs or Gene name,
                <br />
                while 3rd column should be interaction score; examples:{' '}
                <a href={'/example1.csv'} download className='underline'>
                  #1
                </a>{' '}
                <a href={'/example2.csv'} download className='underline'>
                  #2
                </a>
                )
              </p>
            </div>
            <Input
              id='fileUpload'
              type='file'
              accept='.csv,.json'
              onChange={handleFileChange}
              required
              className='border-2 hover:border-dashed cursor-pointer h-9'
            />
          </div>
          <Button
            style={{
              background: 'linear-gradient(45deg, rgba(18,76,103,1) 0%, rgba(9,114,121,1) 35%, rgba(0,0,0,1) 100%)',
            }}
            type='submit'
            className='w-full'
          >
            {loading && <Loader className='animate-spin mr-2' size={20} />} Submit
          </Button>
        </div>
      </form>
      <PopUpTable
        geneIDs={geneIDs}
        tableOpen={tableOpen}
        setTableOpen={setTableOpen}
        data={data}
        handleGenerateGraph={handleGenerateGraph}
      />
      <div className='mt-6 px-8'>
        <h3 className='text-lg font-semibold mb-2'>File Format</h3>
        <Image
          src={'/image/uploadFormat.png'}
          width={400}
          height={400}
          alt='CSV file format example'
          className='w-full max-w-3xl mx-auto mix-blend-multiply'
        />
      </div>
    </div>
  );
}
