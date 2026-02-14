import React, { useCallback } from 'react';
import ReactFlow, {
    Background,
    Controls,
    Edge,
    Node,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    BackgroundVariant,
} from 'reactflow';
import { BeadsEdge } from './BeadsEdge';
import '../flow.css';

const edgeTypes = {
    beads: BeadsEdge,
};

const initialNodes: Node[] = [
    { id: '1', position: { x: 0, y: 0 }, data: { label: 'Document Upload' }, type: 'input' },
    { id: '2', position: { x: 0, y: 150 }, data: { label: 'AI Analysis' } },
    { id: '3', position: { x: 0, y: 300 }, data: { label: 'Structure Generation' } },
    { id: '4', position: { x: 0, y: 450 }, data: { label: 'PPTX Export' }, type: 'output' },
];

const initialEdges: Edge[] = [
    { id: 'e1-2', source: '1', target: '2', type: 'beads', animated: true },
    { id: 'e2-3', source: '2', target: '3', type: 'beads', animated: true },
    { id: 'e3-4', source: '3', target: '4', type: 'beads', animated: true },
];

export const WorkflowEditor: React.FC = () => {
    const [nodes, , onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge({ ...params, type: 'beads', animated: true }, eds)),
        [setEdges],
    );

    return (
        <div className="w-full h-full min-h-[500px] border border-neutral-800 rounded-xl overflow-hidden bg-neutral-900/40 backdrop-blur-sm">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                edgeTypes={edgeTypes}
                fitView
            >
                <Background variant={BackgroundVariant.Dots} gap={12} size={1} color="#333" />
                <Controls />
            </ReactFlow>
        </div>
    );
};
