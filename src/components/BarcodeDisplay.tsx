import { BarcodeFormat } from "@zxing/browser";
import { useBarcode } from "next-barcode";

export type BarcodeDisplayProps = {
    code: string;
    format?: BarcodeFormat;
    width?: number;
    height?: number;
};

export const BarcodeDisplay = (props: BarcodeDisplayProps) => {
    const { code, width = 300, height = 50 } = props;

    const { inputRef } = useBarcode({
        value: code,
        options: {
            format: 'EAN13',
        },
    });

    return (
        <svg ref={inputRef} width={width} height={height} />
    );
};
