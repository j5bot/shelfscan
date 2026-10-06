import { useExtensionTool } from '@/app/lib/hooks/webmcp/extension/useExtensionTool';
import { useBGGCollectionTool } from '@/app/lib/hooks/webmcp/useBGGCollectionTool';
import { useGameUPCDataTools } from '@/app/lib/hooks/webmcp/useGameUPCDataTools';
import { useScannedCodesTool } from '@/app/lib/hooks/webmcp/useScannedCodesTool';
import { useScanUPCTool } from '@/app/lib/hooks/webmcp/useScanUPCTool';
import { ReactNode } from 'react';
import { WebMCPProvider } from 'webmcp-react';

type Props = {
    children: ReactNode;
};

// tool hooks must run inside WebMCPProvider, so they live in a child component
const McpTools = ({ children }: Props) => {
    useBGGCollectionTool();
    useGameUPCDataTools();
    useExtensionTool();
    useScannedCodesTool();
    useScanUPCTool();
    return children;
};

export const McpToolsProvider = ({ children }: Props) =>
    <WebMCPProvider name="shelfscan" version="1.0">
        <McpTools>{children}</McpTools>
    </WebMCPProvider>;
