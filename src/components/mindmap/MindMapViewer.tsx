'use client'

import React, { useCallback, useState, useEffect } from 'react'
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Handle,
  Position,
  NodeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Download, ZoomIn, ZoomOut, Maximize, Share2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import type { MindMapNode } from '@/types/models'

interface MindMapViewerProps {
  data: MindMapNode
  onNodeClick?: (nodeId: string) => void
  onExport?: (format: 'png' | 'svg') => void
  className?: string
}

// 自定义节点组件
function MindMapNodeComponent({ data, selected }: NodeProps) {
  return (
    <div
      className={cn(
        'px-4 py-2 rounded-lg shadow-md min-w-[100px] text-center transition-all',
        data.isRoot && 'bg-primary text-primary-foreground font-bold text-lg',
        data.isBranch && 'bg-secondary text-secondary-foreground',
        !data.isRoot && !data.isBranch && 'bg-accent text-accent-foreground text-sm',
        selected && 'ring-2 ring-primary ring-offset-2'
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-gray-400" />
      <div className="flex items-center gap-2">
        {data.icon && <span>{data.icon}</span>}
        <span className="whitespace-pre-wrap">{data.text}</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-gray-400" />
    </div>
  )
}

const nodeTypes = {
  mindmapNode: MindMapNodeComponent,
}

export function MindMapViewer({
  data,
  onNodeClick,
  onExport,
  className,
}: MindMapViewerProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  // 将树形结构转换为 Flow 节点和边
  const buildFlowData = useCallback(() => {
    const flowNodes: Node[] = []
    const flowEdges: Edge[] = []

    const traverse = (
      node: MindMapNode,
      parentId: string | null = null,
      level: number = 0,
      positionX: number = 0,
      positionY: number = 0
    ) => {
      const nodeId = node.id || `node-${Math.random().toString(36).substring(7)}`

      flowNodes.push({
        id: nodeId,
        type: 'mindmapNode',
        position: { x: positionX, y: positionY },
        data: {
          text: node.text,
          isRoot: level === 0,
          isBranch: level === 1,
          icon: node.style?.backgroundColor ? undefined : undefined,
        },
      })

      if (parentId) {
        flowEdges.push({
          id: `edge-${parentId}-${nodeId}`,
          source: parentId,
          target: nodeId,
          type: 'smoothstep',
          style: { strokeWidth: 2 },
        })
      }

      if (node.children && node.children.length > 0) {
        const childCount = node.children.length
        const spacing = 250
        const startX = positionX - ((childCount - 1) * spacing) / 2

        node.children.forEach((child, index) => {
          traverse(
            child,
            nodeId,
            level + 1,
            startX + index * spacing,
            positionY + 150
          )
        })
      }
    }

    traverse(data)
    return { flowNodes, flowEdges }
  }, [data])

  useEffect(() => {
    const { flowNodes, flowEdges } = buildFlowData()
    setNodes(flowNodes)
    setEdges(flowEdges)
  }, [buildFlowData, setNodes, setEdges])

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onNodeClick?.(node.id)
    },
    [onNodeClick]
  )

  const handleExportPNG = () => onExport?.('png')
  const handleExportSVG = () => onExport?.('svg')

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* 工具栏 */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{data.text}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPNG}>
            <Download className="w-4 h-4 mr-1" />
            PNG
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportSVG}>
            <Download className="w-4 h-4 mr-1" />
            SVG
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-1" />
            分享
          </Button>
        </div>
      </div>

      {/* 思维导图画布 */}
      <div className="flex-1 bg-muted/20">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={handleNodeClick}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
          minZoom={0.1}
          maxZoom={2}
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  )
}
