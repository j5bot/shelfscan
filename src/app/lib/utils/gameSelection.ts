import { GameUPCBggInfo } from 'gameupc-hooks/types';

export type ResolvedGameSelection = {
    currentInfoIndex: number | null;
    currentVersionIndex: number | null;
    selectedInfoId: number | undefined;
    selectedVersionId: number | undefined;
};

const findInfoIndex = (infos: GameUPCBggInfo[], infoId: number | undefined) =>
    infoId === undefined ? -1 : infos.findIndex(info => info.id === infoId);

/**
 * Resolves a stored [infoId, versionId] selection against the current infos.
 * When nothing valid is selected, a lone info (and a lone version within the
 * chosen info) is selected automatically.
 */
export const resolveGameSelection = (
    infos: GameUPCBggInfo[],
    selection: number[] | undefined,
): ResolvedGameSelection => {
    const [infoId, versionId] = selection ?? [];

    const selectedInfoIndex = findInfoIndex(infos, infoId);
    const autoInfoIndex = infos.length === 1 ? 0 : null;
    const currentInfoIndex = selectedInfoIndex > -1 ? selectedInfoIndex : autoInfoIndex;

    const info = currentInfoIndex === null ? undefined : infos[currentInfoIndex];
    const versions = info?.versions ?? [];

    const selectedVersionIndex = selectedInfoIndex > -1 && versionId !== undefined
        ? versions.findIndex(version => version.version_id === versionId)
        : -1;
    const autoVersionIndex = versions.length === 1 ? 0 : null;
    const currentVersionIndex = selectedVersionIndex > -1 ? selectedVersionIndex : autoVersionIndex;

    return {
        currentInfoIndex,
        currentVersionIndex,
        selectedInfoId: info?.id,
        selectedVersionId: currentVersionIndex === null ? undefined : versions[currentVersionIndex]?.version_id,
    };
};
