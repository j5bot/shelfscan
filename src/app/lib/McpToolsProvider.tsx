import { useGameUPCDataTool } from '@/app/lib/hooks/webmcp/useGameUPCDataTool';
import { useScannedCodesTool } from '@/app/lib/hooks/webmcp/useScannedCodesTool';
import { useScanUPCTool } from '@/app/lib/hooks/webmcp/useScanUPCTool';
import { ReactNode } from 'react';
import { WebMCPProvider } from 'webmcp-react';

type Props = {
    children: ReactNode;
};

// tool hooks must run inside WebMCPProvider, so they live in a child component
const McpTools = ({ children }: Props) => {
    useGameUPCDataTool();
    useScannedCodesTool();
    useScanUPCTool();
    return children;
};

export const McpToolsProvider = ({ children }: Props) =>
    <WebMCPProvider name="shelfscan" version="1.0">
        <McpTools>{children}</McpTools>
    </WebMCPProvider>;
