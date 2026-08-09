import { CollectionPageContent } from '@/app/ui/CollectionPageContent';

export default async function SwapPage({
    params,
}: {
    params: Promise<{ swapId: string }>;
}) {
    const { swapId } = await params;
    const id = parseInt(swapId, 10);
    return (
        <CollectionPageContent
            modeOptions={{
                swapId: isNaN(id) ? undefined : id,
            }}
            title="ShelfScan | Swaptagon Math Trade"
            heading="Swaptagon Math Trade"
        />
    );
}
