export interface Edge {
  gene1: string;
  gene2: string;
  score: number;
  [key: string]: any;
}

export function mergeEdgesAndAverageScore(edges: Edge[]): Edge[] {
  const edgeMap = new Map<
    string,
    { totalScore: number; count: number; edge: Edge }
  >();

  for (const edge of edges) {
    const key =
      edge.gene1 < edge.gene2
        ? `${edge.gene1}|${edge.gene2}`
        : `${edge.gene2}|${edge.gene1}`;

    if (!edgeMap.has(key)) {
      edgeMap.set(key, { totalScore: edge.score, count: 1, edge: { ...edge } });
    } else {
      const entry = edgeMap.get(key)!;
      entry.totalScore += edge.score;
      entry.count += 1;
    }
  }

  return Array.from(edgeMap.values()).map(({ totalScore, count, edge }) => ({
    ...edge,
    score: totalScore / count,
  }));
}
