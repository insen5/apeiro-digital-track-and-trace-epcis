'use client';

import React, { useMemo } from 'react';
import { Sankey, Tooltip, ResponsiveContainer, Layer } from 'recharts';
import type { SankeyNode as RechartsSankeyNode, SankeyLink as RechartsSankeyLink } from 'recharts';

interface SankeyNode {
  id: number;
  name: string;
  type: 'port' | 'distributor' | 'facility' | 'unknown';
}

interface SankeyLink {
  source: number;
  target: number;
  value: number;
  eventTime: Date;
  bizStep: string;
}

interface SankeyDiagramProps {
  nodes: SankeyNode[];
  links: SankeyLink[];
  summary?: {
    totalEvents: number;
    portCount: number;
    distributorCount: number;
    facilityCount: number;
  };
}

const nodeColors = {
  port: '#3b82f6', // blue
  distributor: '#10b981', // green
  facility: '#f59e0b', // amber
  unknown: '#6b7280', // gray
};

export default function SankeyDiagram({
  nodes,
  links,
  summary,
}: SankeyDiagramProps) {
  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-gray-500">No flow data available</p>
      </div>
    );
  }

  // Transform data for Recharts Sankey
  const sankeyData = useMemo(() => {
    // Create a map from node id to index for Recharts
    const nodeIdToIndex = new Map<number, number>();
    const rechartsNodes = nodes.map((node, index) => {
      nodeIdToIndex.set(node.id, index);
      return {
        name: node.name,
        nodeColor: nodeColors[node.type] || nodeColors.unknown,
      };
    });

    // Transform links to use indices instead of ids
    const rechartsLinks = links.map((link) => ({
      source: nodeIdToIndex.get(link.source) ?? 0,
      target: nodeIdToIndex.get(link.target) ?? 0,
      value: link.value,
    }));

    return {
      nodes: rechartsNodes,
      links: rechartsLinks,
    };
  }, [nodes, links]);

  // Calculate max value for display
  const maxValue = Math.max(...links.map((l) => l.value), 1);

  // Custom node renderer with better styling
  const CustomNode = ({ x, y, width, height, index, payload, containerWidth }: any) => {
    const isOut = x + width + 6 > containerWidth;
    return (
      <Layer key={`CustomNode${index}`}>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={payload.nodeColor}
          fillOpacity="1"
          rx={4}
        />
        <text
          textAnchor={isOut ? 'end' : 'start'}
          x={isOut ? x - 6 : x + width + 6}
          y={y + height / 2}
          fontSize="14"
          fontWeight="600"
          fill="#374151"
        >
          {payload.name}
        </text>
        <text
          textAnchor={isOut ? 'end' : 'start'}
          x={isOut ? x - 6 : x + width + 6}
          y={y + height / 2 + 16}
          fontSize="11"
          fill="#6b7280"
        >
          {payload.value?.toLocaleString() || 0} units
        </text>
      </Layer>
    );
  };

  // Custom link colors
  const CustomLink = (props: any) => {
    const { sourceX, targetX, sourceY, targetY, sourceControlX, targetControlX, linkWidth, index } = props;
    
    return (
      <Layer key={`CustomLink${index}`}>
        <defs>
          <linearGradient id={`linkGradient${index}`}>
            <stop offset="0%" stopColor={props.payload?.source?.nodeColor || '#3b82f6'} stopOpacity={0.5} />
            <stop offset="100%" stopColor={props.payload?.target?.nodeColor || '#10b981'} stopOpacity={0.5} />
          </linearGradient>
        </defs>
        <path
          d={`
            M${sourceX},${sourceY}
            C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}
          `}
          fill="none"
          stroke={`url(#linkGradient${index})`}
          strokeWidth={linkWidth}
          strokeOpacity={0.5}
          className="hover:stroke-opacity-75 transition-all"
        />
      </Layer>
    );
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-lg p-6">
      {summary && (
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-blue-600 font-semibold">Manufacturers</p>
            <p className="text-2xl font-bold text-blue-800">{summary.manufacturerCount || summary.portCount}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <p className="text-sm text-green-600 font-semibold">Distributors</p>
            <p className="text-2xl font-bold text-green-800">{summary.distributorCount}</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
            <p className="text-sm text-amber-600 font-semibold">Hospitals</p>
            <p className="text-2xl font-bold text-amber-800">{summary.facilityCount}</p>
          </div>
        </div>
      )}

      <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50" style={{ height: '700px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <Sankey
            data={sankeyData}
            nodeWidth={12}
            nodePadding={80}
            linkCurvature={0.5}
            iterations={64}
            node={<CustomNode />}
            link={<CustomLink />}
            margin={{ top: 30, right: 200, bottom: 30, left: 30 }}
          >
            <Tooltip
              content={({ payload }) => {
                if (!payload || payload.length === 0) return null;
                const data = payload[0]?.payload;
                
                if (data?.source && data?.target) {
                  // This is a link
                  return (
                    <div className="bg-white border-2 border-gray-300 rounded-lg shadow-lg p-3">
                      <p className="font-semibold text-gray-800 mb-1">
                        {data.source.name} → {data.target.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Flow: <span className="font-bold">{data.value?.toLocaleString()}</span> units
                      </p>
                    </div>
                  );
                } else if (data?.name) {
                  // This is a node
                  return (
                    <div className="bg-white border-2 border-gray-300 rounded-lg shadow-lg p-3">
                      <p className="font-semibold text-gray-800 mb-1">{data.name}</p>
                      <p className="text-sm text-gray-600">
                        Total: <span className="font-bold">{data.value?.toLocaleString()}</span> units
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </Sankey>
        </ResponsiveContainer>
      </div>

      {/* Legend with flow info */}
      <div className="mt-6">
        <div className="flex justify-center gap-6 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: nodeColors.port }}></div>
            <span className="text-sm text-gray-600">Port/Manufacturer</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: nodeColors.distributor }}></div>
            <span className="text-sm text-gray-600">Distributor</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: nodeColors.facility }}></div>
            <span className="text-sm text-gray-600">Facility</span>
          </div>
        </div>
        <div className="text-center text-sm text-gray-500 italic">
          Flow width represents product quantity • Max: {maxValue.toLocaleString()} units
        </div>
      </div>
    </div>
  );
}


