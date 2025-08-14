'use client';

import {
  DISEASE_DEPENDENT_PROPERTIES,
  type DiseaseDependentProperties,
  type NodeColorType,
  type NodeSizeType,
} from '@/lib/data';
import { useStore } from '@/lib/hooks';
import type { CommonSection, EdgeAttributes, NodeAttributes, OtherSection } from '@/lib/interface';
import { type EventMessage, Events, eventEmitter } from '@/lib/utils';
import { useSigma } from '@react-sigma/core';
import { downloadAsImage } from '@sigma/export-image';
import { unparse } from 'papaparse';
import { useEffect } from 'react';
import { toast } from 'sonner';
import JSZip from 'jszip';

export function GraphExport({ highlightedNodesRef }: { highlightedNodesRef?: React.MutableRefObject<Set<string>> }) {
  const projectTitle = useStore(state => state.projectTitle);
  const sigma = useSigma<NodeAttributes, EdgeAttributes>();

  function downloadFile(content: string, type: string, filename: string) {
    const element = document.createElement('a');
    const file = new Blob([content], { type });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    URL.revokeObjectURL(element.href);
    element.remove();
  }

  useEffect(() => {
    eventEmitter.on(
      Events.EXPORT,
      async ({ format, all, csvType }: EventMessage[Events.EXPORT] & { csvType?: string }) => {
        switch (format) {
          case 'csv': {
            if (!all && (!highlightedNodesRef || highlightedNodesRef.current.size === 0)) {
              toast.warning('No nodes selected', {
                cancel: { label: 'Close', onClick() {} },
              });
              return;
            }

            const graph = sigma.getGraph();
            const {
              selectedNodeColorProperty,
              selectedNodeSizeProperty,
              selectedRadioNodeColor,
              selectedRadioNodeSize,
              radioOptions,
              universalData,
              diseaseName,
            } = useStore.getState();

            const isDatabaseOrUser = (radio: NodeColorType | NodeSizeType, property: string) =>
              radioOptions.user[radio].includes(property)
                ? 'user'
                : DISEASE_DEPENDENT_PROPERTIES.includes(radio as DiseaseDependentProperties)
                  ? diseaseName
                  : 'common';
            const nodeIds = all ? sigma.getGraph().nodes() : Array.from(highlightedNodesRef?.current ?? []);
            const universalCsv = unparse(
              nodeIds.map(nodeId => {
                const universalProperties: Record<string, string> = {};
                if (selectedRadioNodeColor) {
                  if (typeof selectedNodeColorProperty === 'string') {
                    universalProperties[selectedNodeColorProperty] = (
                      universalData[nodeId][
                        isDatabaseOrUser(selectedRadioNodeColor, selectedNodeColorProperty)
                      ] as CommonSection & OtherSection
                    )[selectedRadioNodeColor][selectedNodeColorProperty];
                  } else {
                    for (const property of selectedNodeColorProperty) {
                      universalProperties[property] = (
                        universalData[nodeId][isDatabaseOrUser(selectedRadioNodeColor, property)] as CommonSection &
                          OtherSection
                      )[selectedRadioNodeColor][property];
                    }
                  }
                }

                if (selectedRadioNodeSize) {
                  if (typeof selectedNodeSizeProperty === 'string') {
                    universalProperties[selectedNodeSizeProperty] = (
                      universalData[nodeId][
                        isDatabaseOrUser(selectedRadioNodeSize, selectedNodeSizeProperty)
                      ] as CommonSection & OtherSection
                    )[selectedRadioNodeSize][selectedNodeSizeProperty];
                  } else {
                    for (const property of selectedNodeSizeProperty) {
                      universalProperties[property] = (
                        universalData[nodeId][isDatabaseOrUser(selectedRadioNodeSize, property)] as CommonSection &
                          OtherSection
                      )[selectedRadioNodeSize][property];
                    }
                  }
                }

                return {
                  ID: nodeId,
                  Gene_name: graph.getNodeAttribute(nodeId, 'label'),
                  Description: graph.getNodeAttribute(nodeId, 'description'),
                  ...universalProperties,
                };
              }),
            );
            const nodeSet = new Set(nodeIds);
            const interactionCsv = unparse(
              graph.reduceEdges(
                (acc, _edgeId, attributes, source, target) => {
                  if (nodeSet.has(source) && nodeSet.has(target)) {
                    acc.push({
                      Source: source,
                      Target: target,
                      Score: attributes.score ?? 0,
                    });
                  }
                  return acc;
                },
                [] as { Source: string; Target: string; Score: number }[],
              ),
            );
            // Handle csvType
            if (csvType === 'universal') {
              downloadFile(universalCsv, 'text/csv', `${projectTitle}-universal.csv`);
            } else if (csvType === 'interaction') {
              if (interactionCsv) {
                downloadFile(interactionCsv, 'text/csv', `${projectTitle}-interaction.csv`);
              } else {
                toast.info('No interactions found for selected nodes.', {
                  cancel: { label: 'Close', onClick() {} },
                });
              }
            } else if (csvType === 'both') {
              // Zip both files
              const zip = new JSZip();
              zip.file(`${projectTitle}-universal.csv`, universalCsv);
              if (interactionCsv) {
                zip.file(`${projectTitle}-interaction.csv`, interactionCsv);
              }
              const content = await zip.generateAsync({ type: 'blob' });
              const element = document.createElement('a');
              element.href = URL.createObjectURL(content);
              element.download = `${projectTitle}-csv.zip`;
              document.body.appendChild(element);
              element.click();
              URL.revokeObjectURL(element.href);
              element.remove();
            }
            break;
          }
          default: {
            downloadAsImage(sigma, {
              format,
              fileName: projectTitle,
              backgroundColor: 'white',
            });
          }
        }
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
