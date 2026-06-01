
const express = require('express');
const crypto = require('crypto');
const router = express.Router();

router.post('/create-khqr-payment', async (req, res) => {
    try {
        const { order_id, amount, remark } = req.body;

        // Ensure you have these in your .env file
        const profileId = process.env.KHQR_PROFILE_ID;
        const secretKey = process.env.KHQR_SECRET_KEY;

        // Prepare the raw string for hashing
        const successUrl = `${req.protocol}://${req.get('host')}/api/payment/success`;
        const rawString = `${secretKey}${order_id}${amount}${successUrl}${remark}`;

        // Generate SHA1 hash
        const hash = crypto.createHash('sha1').update(rawString).digest('hex');

        // Build the redirect URL
        const redirectUrl = `https://khqr.cc/api/payment/request/${profileId}?transaction_id=${order_id}&amount=${amount}&success_url=${encodeURIComponent(successUrl)}&remark=${encodeURIComponent(remark)}&hash=${hash}`;

        // Send the URL to the frontend or redirect directly
        // For a pure API, you can send the URL back:
        res.json({ redirect_url: redirectUrl });
        
        // Or redirect the user directly if this is a server-rendered app:
        // res.redirect(redirectUrl);
    } catch (error) {
        console.error('Payment creation error:', error);
        res.status(500).json({ error: error.message });
    }
});