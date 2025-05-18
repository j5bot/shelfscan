'use client';

import { useGameUPCApi } from '@/app/lib/hooks/useGameUPCApi';
import { BarcodeScanner, BarcodeScannerProps } from '@react-barcode-scanner/components/dist';
import React, { useState } from 'react';
import { FaBarcode } from 'react-icons/fa6';
import { GiCardPick } from 'react-icons/gi';

type ExtendedProps = BarcodeScannerProps & { scanLine?: boolean };


export default function Home(props: ExtendedProps) {
    const {
        gameDataMap,
        getGameData,
        submitOrVerifyGame,
        removeGame,
    } = useGameUPCApi({});

    const {
        scanLine = true,
        canvasHeight = 240,
        canvasWidth = 320,
        videoHeight = 480,
        videoWidth = 640,
        videoCropHeight = 240,
        videoCropWidth= 320,
        zoom = 2,
        blur = 0,
    } = props;

    const [codes, setCodes] = useState<string[]>([]);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

    const onScan = async (code: string) => {
        if (codes.includes(code)) {
            return;
        }
        setCodes(codes.concat(code));
        await getGameData(code);
    };
    // @ts-ignore IDE doesn't recognize the MediaDeviceInfo built-in type
    const onDevices = (devices: MediaDeviceInfo[]) => {
        setDevices(devices);
    };

    return (
        <div className="flex flex-col w-full items-center">
                <div className="flex gap-2 p-15 pb-5 relative">
                    <BarcodeScanner
                        devices={devices}
                        onDevices={onDevices}
                        onScan={onScan}
                        settings={{
                            scanLine,
                        }}
                        canvasWidth={canvasWidth}
                        canvasHeight={canvasHeight}
                        videoWidth={videoWidth}
                        videoHeight={videoHeight}
                        videoCropHeight={videoCropHeight}
                        videoCropWidth={videoCropWidth}
                        zoom={zoom}
                        blur={blur}
                    />
                    <div className="absolute right-0 flex flex-col gap-2">
                        <button className={`p-2 cursor-pointer bg-gray-300 rounded-sm`}>
                            <FaBarcode size={32} />
                        </button>
                        <button className={`p-2 cursor-pointer bg-gray-100 rounded-sm`}>
                            <GiCardPick size={32} />
                        </button>
                    </div>
                </div>
                <fieldset className="bg-gray-100 rounded-lg flex gap-4 p-5">
                    <input className="bg-white p-2 rounded-md"
                       type="text" name="username" placeholder="BGG Username" />
                    <input className="bg-white p-2 rounded-md"
                       type="password" name="password" placeholder="BGG Password" />
                    <button className="p-2 rounded-md bg-gray-200 whitespace-nowrap" type="button" name="login">
                        Log In
                    </button>
                </fieldset>
                <div className="items-start p-5">
                    <ul>
                        {codes.map(code => (
                            <li>
                                {code} - {Object.entries(gameDataMap[code]).length > 0 ? JSON.stringify(gameDataMap[code], undefined, 2) : 'Not found'}
                            </li>
                        ))}
                    </ul>
                </div>
        </div>);

  // return (
  //   <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
  //     <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
  //       <Image
  //         className="dark:invert"
  //         src="/next.svg"
  //         alt="Next.js logo"
  //         width={180}
  //         height={38}
  //         priority
  //       />
  //       <ol className="list-inside list-decimal text-sm/6 text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
  //         <li className="mb-2 tracking-[-.01em]">
  //           Get started by editing{" "}
  //           <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-[family-name:var(--font-geist-mono)] font-semibold">
  //             src/app/page.tsx
  //           </code>
  //           .
  //         </li>
  //         <li className="tracking-[-.01em]">
  //           Save and see your changes instantly.
  //         </li>
  //       </ol>
  //
  //       <div className="flex gap-4 items-center flex-col sm:flex-row">
  //         <a
  //           className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
  //           href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
  //           target="_blank"
  //           rel="noopener noreferrer"
  //         >
  //           <Image
  //             className="dark:invert"
  //             src="/vercel.svg"
  //             alt="Vercel logomark"
  //             width={20}
  //             height={20}
  //           />
  //           Deploy now
  //         </a>
  //         <a
  //           className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
  //           href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
  //           target="_blank"
  //           rel="noopener noreferrer"
  //         >
  //           Read our docs
  //         </a>
  //       </div>
  //     </main>
  //     <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
  //       <a
  //         className="flex items-center gap-2 hover:underline hover:underline-offset-4"
  //         href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
  //         target="_blank"
  //         rel="noopener noreferrer"
  //       >
  //         <Image
  //           aria-hidden
  //           src="/file.svg"
  //           alt="File icon"
  //           width={16}
  //           height={16}
  //         />
  //         Learn
  //       </a>
  //       <a
  //         className="flex items-center gap-2 hover:underline hover:underline-offset-4"
  //         href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
  //         target="_blank"
  //         rel="noopener noreferrer"
  //       >
  //         <Image
  //           aria-hidden
  //           src="/window.svg"
  //           alt="Window icon"
  //           width={16}
  //           height={16}
  //         />
  //         Examples
  //       </a>
  //       <a
  //         className="flex items-center gap-2 hover:underline hover:underline-offset-4"
  //         href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
  //         target="_blank"
  //         rel="noopener noreferrer"
  //       >
  //         <Image
  //           aria-hidden
  //           src="/globe.svg"
  //           alt="Globe icon"
  //           width={16}
  //           height={16}
  //         />
  //         Go to nextjs.org →
  //       </a>
  //     </footer>
  //   </div>
  // );
}
