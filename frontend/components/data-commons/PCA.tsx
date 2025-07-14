'use client';

import { useEffect, useState } from 'react';
import Papa from 'papaparse';
import Plot from 'react-plotly.js';
import type { PlotData } from 'plotly.js';

type PCARow = {
  'ENSCGRG-Id': string;
  PC1: number;
  PC2: number;
};

type SampleRow = {
  'Sample name': string;
  Group: string;
};

const COLORS = [
  '#1f77b4',
  '#ff7f0e',
  '#2ca02c',
  '#d62728',
  '#9467bd',
  '#8c564b',
  '#e377c2',
  '#7f7f7f',
  '#bcbd22',
  '#17becf',
];

interface PCAProps {
  samplesheetUrl?: string;
  pcaUrl?: string;
}

export default function PCA({ samplesheetUrl, pcaUrl }: PCAProps) {
  const [traces, setTraces] = useState<Partial<PlotData>[]>([]);
  const [groupToColor, setGroupToColor] = useState<Record<string, string>>({});
  const [sampleDataExists, setSampleDataExists] = useState(false);

  useEffect(() => {
    const loadPCAData = (
      idToGroup: Record<string, string>,
      groupColor: Record<string, string>,
      hasSampleData: boolean,
    ) => {
      if (!pcaUrl) {
        setTraces([]);
        return;
      }
      fetch(pcaUrl)
        .then(res => res.text())
        .then(pcaText => {
          Papa.parse<PCARow>(pcaText, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: pcaResults => {
              if (!hasSampleData) {
                const allData = {
                  x: [] as number[],
                  y: [] as number[],
                  text: [] as string[],
                };

                pcaResults.data.forEach(row => {
                  allData.x.push(row.PC1);
                  allData.y.push(row.PC2);
                  allData.text.push(row['ENSCGRG-Id']);
                });

                const traces: Partial<PlotData>[] = [
                  {
                    x: allData.x,
                    y: allData.y,
                    text: allData.text.map(id => `ID: ${id}`),
                    type: 'scatter',
                    mode: 'markers',
                    name: 'Data Points',
                    marker: { color: '#6b7280', size: 7 },
                    hovertemplate: '%{text}<extra></extra>',
                  },
                ];
                setTraces(traces);
              } else {
                const grouped: Record<string, { x: number[]; y: number[]; text: string[] }> = {};
                pcaResults.data.forEach(row => {
                  const group = idToGroup[row['ENSCGRG-Id']] || 'Unknown';
                  if (!grouped[group]) grouped[group] = { x: [], y: [], text: [] };
                  grouped[group].x.push(row.PC1);
                  grouped[group].y.push(row.PC2);
                  grouped[group].text.push(row['ENSCGRG-Id']);
                });

                const traces: Partial<PlotData>[] = Object.entries(grouped).map(([group, data], idx) => ({
                  x: data.x,
                  y: data.y,
                  text: data.text.map(id => `ID: ${id}<br>Group: ${group}`),
                  type: 'scatter',
                  mode: 'markers',
                  name: group,
                  marker: { color: groupColor[group] || COLORS[idx % COLORS.length], size: 7 },
                  hovertemplate: '%{text}<extra></extra>',
                }));
                setTraces(traces);
              }
            },
          });
        })
        .catch(() => {
          setTraces([]);
        });
    };

    if (!samplesheetUrl) {
      setSampleDataExists(false);
      setGroupToColor({});
      loadPCAData({}, {}, false);
      return;
    }

    fetch(samplesheetUrl)
      .then(res => {
        if (!res.ok) {
          throw new Error('Sample file not found');
        }
        return res.text();
      })
      .then(sampleText => {
        Papa.parse<SampleRow>(sampleText, {
          header: true,
          skipEmptyLines: true,
          complete: sampleResults => {
            const idToGroup: Record<string, string> = {};
            const groupSet = new Set<string>();
            sampleResults.data.forEach(row => {
              if (row['Sample name'] && row.Group) {
                idToGroup[row['Sample name']] = row.Group;
                groupSet.add(row.Group);
              }
            });
            const groupArr = Array.from(groupSet).sort();
            const groupColor: Record<string, string> = {};
            groupArr.forEach((g, i) => {
              groupColor[g] = COLORS[i % COLORS.length];
            });
            setGroupToColor(groupColor);
            setSampleDataExists(true);
            loadPCAData(idToGroup, groupColor, true);
          },
        });
      })
      .catch(() => {
        setSampleDataExists(false);
        setGroupToColor({});
        loadPCAData({}, {}, false);
      });
  }, [samplesheetUrl, pcaUrl]);

  function renderGroupLegend() {
    if (!sampleDataExists) return null;

    const groupNames = Object.keys(groupToColor).sort();
    if (groupNames.length === 0) return null;

    return (
      <div className='flex gap-4 mb-6 flex-wrap justify-center'>
        {groupNames.map(group => (
          <div key={group} className='flex items-center gap-2'>
            <span
              style={{
                display: 'inline-block',
                width: 16,
                height: 16,
                background: groupToColor[group],
                borderRadius: 4,
                border: '1px solid #ccc',
              }}
            />
            <span className='text-sm font-medium'>{group}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className='w-full px-4 sm:px-6 lg:px-8 max-w-[95vw] lg:max-w-[1400px] mx-auto'>
      <h2 className='text-xl sm:text-2xl font-semibold mb-6 text-center'>PCA Plot (PC1 vs PC2)</h2>

      <div className='min-h-[40px] flex items-center justify-center mb-6'>{renderGroupLegend()}</div>

      <div className='relative w-full min-h-[400px] sm:min-h-[500px] md:min-h-[600px] lg:min-h-[750px] xl:min-h-[850px] 2xl:min-h-[950px]'>
        <Plot
          data={traces}
          layout={{
            title: { text: 'PCA Plot', font: { size: 18 } },
            xaxis: {
              title: { text: 'PC1' },
              automargin: true,
              tickangle: 0,
              tickfont: { size: 12 },
            },
            yaxis: {
              title: { text: 'PC2' },
              tickfont: { size: 12 },
            },
            margin: { t: 60, l: 60, r: 40, b: 80 },
            autosize: true,
            showlegend: false,
          }}
          useResizeHandler
          style={{ width: '100%', height: '100%' }}
          config={{ responsive: true, displayModeBar: false }}
        />
      </div>
    </div>
  );
}
