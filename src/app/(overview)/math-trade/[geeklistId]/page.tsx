import { CollectionPageContent } from '@/app/ui/CollectionPageContent';

export default async function MathTradePage({
    params,
}: {
    params: Promise<{ geeklistId: string }>;
}) {
    const { geeklistId } = await params;
    const id = parseInt(geeklistId, 10);
    return (
        <CollectionPageContent
            initialMathTradeGeeklistId={isNaN(id) ? undefined : id}
            title="ShelfScan | Math Trade"
            heading="Math Trade"
        />
    );
}
