'use client';
import React from 'react';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multiselect';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

interface FileSelectionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  selectedGroup: string;
  selectedProgram: string;
  selectedProject: string;
}

interface FileOptions {
  gene: string[];
  transcript: string[];
  pca: string[];
  differentialexpression: string[];
}

const filterCsvTsv = (files: string[]) =>
  files.filter(f => f.toLowerCase().endsWith('.csv') || f.toLowerCase().endsWith('.tsv'));

const truncateFilename = (filename: string, maxLength = 50) => {
  if (filename.length <= maxLength) return filename;
  const extension = filename.split('.').pop();
  const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
  const truncatedName = nameWithoutExt.substring(0, maxLength - extension!.length - 4) + '...';
  return `${truncatedName}.${extension}`;
};

export default function FileSelectionPopup({
  isOpen,
  onClose,
  selectedGroup,
  selectedProgram,
  selectedProject,
}: FileSelectionPopupProps) {
  const router = useRouter();

  const [isEditing, setIsEditing] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [fileOptions, setFileOptions] = React.useState<FileOptions>({
    gene: [],
    transcript: [],
    pca: [],
    differentialexpression: [],
  });

  const [selections, setSelections] = React.useState({
    gene: '',
    transcript: '',
    pca: '',
    differentialexpression: [] as string[],
  });

  const canProceed =
    selections.gene &&
    selections.transcript &&
    selections.pca &&
    selections.differentialexpression.length > 0 &&
    !loading;

  const orderFiles = (files: string[], type: keyof FileOptions) => {
    const keyword = type.toLowerCase();
    const filtered = filterCsvTsv(files);
    const matching = filtered.filter(f => f.toLowerCase().includes(keyword));
    const others = filtered.filter(f => !f.toLowerCase().includes(keyword));
    return [...matching, ...others];
  };

  React.useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (isOpen && selectedGroup && selectedProgram && selectedProject) {
      setLoading(true);

      const keys: (keyof FileOptions)[] = ['gene', 'transcript', 'pca', 'differentialexpression'];

      const fetchFileList = async (key: keyof FileOptions) => {
        const url = `${API_BASE}/data-commons/project/${encodeURIComponent(
          selectedGroup,
        )}/${encodeURIComponent(selectedProgram)}/${encodeURIComponent(
          selectedProject,
        )}/files/keys/${encodeURIComponent(key)}`;
        try {
          const res = await fetch(url);
          const json = await res.json();
          return [key, json.allFiles ?? json.filesHavingSameKey ?? []] as [keyof FileOptions, string[]];
        } catch (error) {
          console.error(`Failed to fetch files for ${key}:`, error);
          return [key, []] as [keyof FileOptions, string[]];
        }
      };

      Promise.all(keys.map(fetchFileList)).then(results => {
        const options: FileOptions = {
          gene: [],
          transcript: [],
          pca: [],
          differentialexpression: [],
        };
        results.forEach(([key, files]) => {
          options[key] = filterCsvTsv(files);
        });
        setFileOptions(options);

        setSelections({
          gene: options.gene.find(f => f.toLowerCase().includes('gene')) || options.gene[0] || '',
          transcript:
            options.transcript.find(f => f.toLowerCase().includes('transcript')) || options.transcript[0] || '',
          pca: options.pca.find(f => f.toLowerCase().includes('pca')) || options.pca[0] || '',
          differentialexpression: options.differentialexpression.filter(f =>
            f.toLowerCase().includes('differentialexpression'),
          ),
        });

        setLoading(false);
      });
    }
  }, [isOpen, selectedGroup, selectedProgram, selectedProject]);

  const handleChange = (type: keyof FileOptions, value: string | string[]) => {
    setSelections(prev => ({ ...prev, [type]: value }));
  };

  const confirmProceed = () => {
    const params = new URLSearchParams({
      group: selectedGroup,
      program: selectedProgram,
      project: selectedProject,
      geneFile: selections.gene,
      transcriptFile: selections.transcript,
      pcaFile: selections.pca,
      deFiles: selections.differentialexpression.join(','),
    });
    router.push(`/data?${params.toString()}`);
    onClose();
  };

  const renderRow = (label: string, type: keyof FileOptions) => {
    if (type === 'differentialexpression') {
      return (
        <div className='flex flex-col sm:flex-row sm:items-center gap-4'>
          <Label className='w-full sm:w-32 text-left sm:text-right text-sm font-medium'>{label}</Label>
          <div className='flex flex-col w-full'>
            <span className='text-sm text-muted-foreground'>
              Selected:{' '}
              <strong>
                {selections.differentialexpression.length > 0
                  ? `${selections.differentialexpression.length} files`
                  : 'None'}
              </strong>
            </span>
            <MultiSelect
              options={orderFiles(fileOptions.differentialexpression, 'differentialexpression').map(file => ({
                label: file,
                value: file,
              }))}
              selectedValues={selections.differentialexpression}
              onChange={v => handleChange('differentialexpression', v)}
              placeholder='Select Differential Expression files'
            />
          </div>
        </div>
      );
    }

    const allFiles = orderFiles(fileOptions[type], type);
    const selectedFile = selections[type] as string;
    const remainingFiles = allFiles.filter(f => f !== selectedFile);

    return (
      <div className='flex flex-col sm:flex-row sm:items-center gap-4'>
        <Label className='w-full sm:w-32 text-left sm:text-right text-sm font-medium'>{label}</Label>
        <div className='flex flex-col w-full'>
          <span className='text-sm text-muted-foreground'>
            Selected:{' '}
            <strong className='truncate block' title={selectedFile}>
              {selectedFile ? truncateFilename(selectedFile) : 'None'}
            </strong>
          </span>
          <Select value={selectedFile} onValueChange={v => handleChange(type, v)} disabled={allFiles.length === 0}>
            <SelectTrigger className='w-full'>
              <SelectValue placeholder={`Select ${type} file`} />
            </SelectTrigger>
            <SelectContent side='bottom' align='start'>
              {allFiles.length === 0 ? (
                <div className='px-4 py-2 text-sm text-muted-foreground'>No files available</div>
              ) : (
                <>
                  {selectedFile && (
                    <SelectItem key={selectedFile} value={selectedFile}>
                      <span className='truncate' title={selectedFile}>
                        {truncateFilename(selectedFile)}
                      </span>
                    </SelectItem>
                  )}
                  {remainingFiles.map(file => (
                    <SelectItem key={file} value={file}>
                      <span className='text-sm break-all'>{file}</span>
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen}>
      {isEditing ? (
        <DialogContent className='max-w-4xl w-full sm:w-[95vw] max-h-[90vh] min-h-[60vh] flex flex-col'>
          <DialogTitle>Edit Analysis Files</DialogTitle>
          <div className='flex-grow space-y-6 overflow-y-auto px-2 md:px-4 py-2'>
            {loading ? (
              <div className='text-center py-8 text-gray-500'>Loading available files...</div>
            ) : (
              <div className='space-y-8'>
                {renderRow('Gene File', 'gene')}
                {renderRow('Transcript File', 'transcript')}
                {renderRow('PCA File', 'pca')}
                {renderRow('Differential Expression', 'differentialexpression')}
              </div>
            )}
          </div>
          <DialogFooter className='gap-2 flex-col sm:flex-row justify-between'>
            <DialogClose asChild>
              <Button
                type='button'
                variant='secondary'
                onClick={() => {
                  setIsEditing(false);
                  onClose();
                }}
                className='w-full sm:w-auto'
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              onClick={() => setIsEditing(false)}
              disabled={!canProceed}
              className='bg-primary text-white hover:bg-primary w-full sm:w-auto'
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      ) : (
        <DialogContent className='max-w-2xl w-full sm:w-[95vw]'>
          <DialogTitle>Confirm File Selection</DialogTitle>
          <div className='flex-grow space-y-4 overflow-y-auto px-2 md:px-4 py-2 max-h-[60vh]'>
            <div className='space-y-3'>
              <div>
                <p className='font-medium'>Gene File:</p>
                <div className='max-h-32 overflow-y-auto bg-muted/50 rounded p-2 text-xs space-y-1'>
                  <div className='truncate' title={selections.gene}>
                    {selections.gene}
                  </div>
                </div>
              </div>
              <div>
                <p className='font-medium'>Transcript File:</p>
                <div className='max-h-32 overflow-y-auto bg-muted/50 rounded p-2 text-xs space-y-1'>
                  <div className='truncate' title={selections.transcript}>
                    {selections.transcript}
                  </div>
                </div>
              </div>
              <div>
                <p className='font-medium'>PCA File:</p>
                <div className='max-h-32 overflow-y-auto bg-muted/50 rounded p-2 text-xs space-y-1'>
                  <div className='truncate' title={selections.pca}>
                    {selections.pca}
                  </div>
                </div>
              </div>
              <div>
                <p className='font-medium'>
                  {selections.differentialexpression.length === 1
                    ? 'Differential Expression File:'
                    : `Differential Expression Files (${selections.differentialexpression.length}):`}
                </p>
                <div className='max-h-32 overflow-y-auto bg-muted/50 rounded p-2 text-xs space-y-1'>
                  {selections.differentialexpression.length === 1 ? (
                    <div className='truncate' title={selections.differentialexpression[0]}>
                      {selections.differentialexpression[0]}
                    </div>
                  ) : (
                    selections.differentialexpression.map((file, index) => (
                      <div key={index} className='truncate' title={file}>
                        {file}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className='gap-2 flex-col sm:flex-row justify-between'>
            <DialogClose asChild>
              <Button type='button' variant='ghost' onClick={onClose} className='w-full sm:w-auto'>
                Cancel
              </Button>
            </DialogClose>
            <Button type='button' variant='secondary' onClick={() => setIsEditing(true)} className='w-full sm:w-auto'>
              Edit Selection
            </Button>
            <Button
              onClick={confirmProceed}
              className='bg-primary text-white hover:bg-primary w-full sm:w-auto'
              disabled={!canProceed}
            >
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}
