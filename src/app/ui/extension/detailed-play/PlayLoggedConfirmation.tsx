import { FaCircleCheck } from 'react-icons/fa6';

export const PlayLoggedConfirmation = ({ gameName, playDate }: { gameName?: string; playDate: string }) =>
    <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
        <FaCircleCheck className="text-[#e07ca4] w-9 h-9" />
        <div>
            <p className="font-semibold text-sm">Play logged!</p>
            {gameName && (
                <p className="text-xs text-base-content/60 mt-1">
                    <strong>{gameName}</strong>
                    {' on '}
                    {new Date(playDate + 'T00:00:00').toLocaleDateString(undefined, {
                        year: 'numeric', month: 'long', day: 'numeric',
                    })}
                </p>
            )}
        </div>
    </div>;
