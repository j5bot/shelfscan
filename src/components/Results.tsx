import { Button, ButtonGroup, Intent, MenuItem } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { Select2 } from '@blueprintjs/select';
import { useCallback, useEffect, useState } from 'react';
import { GameUPCBggInfo, GameUPCBggVersion, GameUPCData } from '../types';

export type ResultsButtonsProps = {
    settings: Record<string, boolean | RegExp>;
    gameData?: GameUPCData;
    submitOrVerifyGame: (upc: string, bggId: number, version: number) => Promise<GameUPCData>;
    removeGame: (upc: string, bggId: number, version: number) => Promise<GameUPCData>;
};

export const Results = (props: ResultsButtonsProps) => {
    const { settings, removeGame, submitOrVerifyGame, gameData } = props;
    const [selectedGame, setSelectedGame] = useState<GameUPCBggInfo | undefined>();
    const [selectedVersion, setSelectedVersion] = useState<GameUPCBggVersion>({ version_id: -1, name: '<Select Version>' } as GameUPCBggVersion);

    const onVersionSelect = useCallback((version: GameUPCBggVersion) => {
        console.log(version);
        setSelectedVersion(version);
    }, [setSelectedVersion]);
    const onGameSelect = useCallback((game: GameUPCBggInfo) => {
        setSelectedGame(game);
    }, [setSelectedGame]);

    useEffect(() => {
        setSelectedGame(gameData?.bgg_info[0]);
    }, [gameData]);

    if (!gameData) {
        return null;
    }

    const { upc, bgg_info: bggInfo } = gameData;
    const { id: bggId, versions = [] } = bggInfo?.find((info) => info === selectedGame) ?? bggInfo[0];

    // const { version_id: versionId, name, published = -1 } = selectedVersion;

    const renderBggVersion = (version: any, modifiers: any) => {
        return <MenuItem key={version?.version_id ?? version?.id}
                         label={version?.published > 0 ? version.published.toString() : undefined}
                         text={version?.name}
                         onClick={modifiers?.handleClick}
        />;
    };

    const singleOrNoBggInfo = bggInfo.length <= 1;

    const selected = selectedVersion ?? selectedGame;

    return (
        <>
            <ButtonGroup className={'results-buttons-group'}>
                <Select2<GameUPCBggInfo> items={bggInfo} itemRenderer={renderBggVersion} onItemSelect={onGameSelect}>
                    <Button rightIcon={singleOrNoBggInfo ? undefined : IconNames.CHEVRON_DOWN}>
                        {renderBggVersion(selectedGame, {})}
                    </Button>
                </Select2>
                <span className={'results-buttons-version-label'}>version</span>
                <Select2<GameUPCBggVersion> items={versions} itemRenderer={renderBggVersion} onItemSelect={onVersionSelect}>
                    <Button rightIcon={IconNames.CHEVRON_DOWN}>
                        {renderBggVersion(selectedVersion, {})}
                    </Button>
                </Select2>
                <Button intent={Intent.PRIMARY} onClick={() => submitOrVerifyGame(upc, bggId, selectedVersion.version_id)}>Submit</Button>
                <Button intent={Intent.WARNING} onClick={() => removeGame(upc, bggId, selectedVersion.version_id)}>Remove</Button>
            </ButtonGroup>
            {selectedGame?.image_url && <img src={selectedGame?.image_url} height={400} /> }
            {selectedVersion.image_url && <img src={selectedVersion?.image_url} height={400} />}
            {/*<textarea readOnly={true} rows={10} cols={100} value={JSON.stringify(selectedVersion, undefined, 2)} />*/}
        </>
    );
};
