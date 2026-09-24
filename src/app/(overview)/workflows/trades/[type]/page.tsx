import { WorkflowTitleKey } from '@/app/lib/types/workflows';
import { SingleWorkflow } from '@/app/ui/workflows/math-trades/SingleWorkflow';
import React, { Suspense } from 'react';

type PageProps = {
    params: Promise<{type: WorkflowTitleKey}>;
};

const SingleMathTradeWorkflowPage = async ({ params }: PageProps) => {
    const type = (await params).type;
    return <Suspense>
        <SingleWorkflow type={type} />
    </Suspense>
};

export default SingleMathTradeWorkflowPage;
