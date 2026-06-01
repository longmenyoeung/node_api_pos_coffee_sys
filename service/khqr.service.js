const { createKHQR } = require('@manethpak/khqr-sdk');

let khqr = null;

const initKHQR = () => {
    if (!khqr) {
        khqr = createKHQR({
            baseURL: process.env.BAKONG_API_BASEURL,
            auth: { type: 'Bearer', token: process.env.BAKONG_API_TOKEN },
        });
    }
    return khqr;
};

const generateDynamicQR = async (orderId, amountInKHR, expirationTimestamp) => {
    try {
        const client = initKHQR();
        const result = client.qr.generateKHQR({
            bakongAccountID: process.env.BAKONG_MERCHANT_ID,
            merchantName: process.env.BAKONG_MERCHANT_NAME,
            merchantCity: process.env.BAKONG_MERCHANT_CITY,
            amount: amountInKHR,
            currency: 'KHR',
            billNumber: `INV-${orderId}`,
            storeLabel: 'Main Counter',
            expirationTimestamp: expirationTimestamp,   // required
        });
        if (result.error) return { error: result.error };
        return { qrString: result.result.qr, md5Hash: result.result.md5 };
    } catch (error) {
        return { error: error.message };
    }
};

const checkTransactionStatus = async (md5Hash) => {
    try {
        const response = await fetch(`${process.env.BAKONG_API_BASEURL}/v1/check_transaction_by_md5`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.BAKONG_API_TOKEN}`
            },
            body: JSON.stringify({ md5: md5Hash })
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Bakong API HTTP error:', response.status, errorText);
            return { error: `HTTP ${response.status}`, status: 'ERROR' };
        }
        const data = await response.json();
        console.log('Bakong response:', data);

        const transactionStatus = data.data?.transaction_status;
        const isPaid = transactionStatus === 'Completed';
        return {
            status: isPaid ? 'COMPLETED' : 'PENDING',
            transactionData: data
        };
    } catch (error) {
        console.error('Exception checking transaction:', error);
        return { error: error.message, status: 'ERROR' };
    }
};



module.exports = {
    generateDynamicQR,
    checkTransactionStatus,
};