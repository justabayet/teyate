import { QRCodeSVG } from 'qrcode.react';

interface QRCodeProps {
    url: string
    size?: number
}

function QRCode({ url, size = 256 }: QRCodeProps) {

    return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
            <QRCodeSVG
                value={url}

                size={size}

                level="H" // Error correction level: L, M, Q, H (H is highest)

                bgColor="#FFFFFF"
                fgColor="#111"
            />
        </div>
    );
}

export default QRCode;