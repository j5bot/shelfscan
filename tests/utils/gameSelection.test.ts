import { describe, it, expect } from '../setup';
import { resolveGameSelection } from '@/app/lib/utils/gameSelection';
import { GameUPCBggInfo } from 'gameupc-hooks/types';

const makeInfo = (id: number, versionIds: number[]) =>
    ({ id, versions: versionIds.map(version_id => ({ version_id })) }) as unknown as GameUPCBggInfo;

describe('resolveGameSelection', () => {
    it('selects nothing when there are several infos and no selection', () => {
        expect(resolveGameSelection([makeInfo(1, [10]), makeInfo(2, [20])], undefined)).toEqual({
            currentInfoIndex: null,
            currentVersionIndex: null,
            selectedInfoId: undefined,
            selectedVersionId: undefined,
        });
    });

    it('auto-selects a lone info and its lone version', () => {
        expect(resolveGameSelection([makeInfo(1, [10])], undefined)).toEqual({
            currentInfoIndex: 0,
            currentVersionIndex: 0,
            selectedInfoId: 1,
            selectedVersionId: 10,
        });
    });

    it('auto-selects a lone info but not one of several versions', () => {
        expect(resolveGameSelection([makeInfo(1, [10, 11])], undefined)).toMatchObject({
            currentInfoIndex: 0,
            currentVersionIndex: null,
            selectedVersionId: undefined,
        });
    });

    it('uses a stored info and version selection', () => {
        expect(resolveGameSelection([makeInfo(1, [10]), makeInfo(2, [20, 21])], [2, 21])).toEqual({
            currentInfoIndex: 1,
            currentVersionIndex: 1,
            selectedInfoId: 2,
            selectedVersionId: 21,
        });
    });

    it('auto-selects the lone version of a stored info with no version', () => {
        expect(resolveGameSelection([makeInfo(1, [10, 11]), makeInfo(2, [20])], [2])).toMatchObject({
            currentInfoIndex: 1,
            currentVersionIndex: 0,
            selectedVersionId: 20,
        });
    });

    it('falls back when the stored info is not among the current infos', () => {
        expect(resolveGameSelection([makeInfo(1, [10]), makeInfo(2, [20])], [99, 990])).toMatchObject({
            currentInfoIndex: null,
            selectedInfoId: undefined,
        });
        expect(resolveGameSelection([makeInfo(1, [10, 11])], [99, 990])).toMatchObject({
            currentInfoIndex: 0,
            currentVersionIndex: null,
        });
    });

    it('ignores a stored version that does not belong to the info', () => {
        expect(resolveGameSelection([makeInfo(1, [10, 11]), makeInfo(2, [20, 21])], [2, 10])).toMatchObject({
            currentInfoIndex: 1,
            currentVersionIndex: null,
        });
    });
});
