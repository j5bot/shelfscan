import { WorkflowTitleKey, WorkflowTitles } from '@/app/lib/types/workflows';
import { SingleWorkflow } from '@/app/ui/workflows/math-trades/SingleWorkflow';
import { redirect } from 'next/navigation';
import React, { Suspense } from 'react';

type PageProps = {
    params: Promise<{type: WorkflowTitleKey}>;
};

const SingleMathTradeWorkflowPage = async ({ params }: PageProps) => {
    const type = (await params).type;
    if (!Object.hasOwn(WorkflowTitles, type)) {
        redirect('/workflows/trades');
    }
    return <Suspense>
        <SingleWorkflow type={type} />
    </Suspense>
};

export default SingleMathTradeWorkflowPage;
