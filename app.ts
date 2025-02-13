import express from "express";
import {Request, Response} from "express";
import { Webhook, WebhookUnbrandedRequiredHeaders, WebhookVerificationError } from "standardwebhooks"

const app = express();
const port = process.env.PORT || 3001;
const renderWebhookSecret = process.env.RENDER_WEBHOOK_SECRET || '';

app.post("/webhook", express.raw({type: 'application/json'}), (req: Request, res: Response, next: any) => {
    const headers: WebhookUnbrandedRequiredHeaders = {
        "webhook-id": req.header("webhook-id") || "",
        "webhook-timestamp": req.header("webhook-timestamp") || "",
        "webhook-signature": req.header("webhook-signature") || ""
    }

    try {
        const wh = new Webhook(renderWebhookSecret);
        wh.verify(req.body, headers);
    } catch (error) {
       return next(error)
    }

    res.status(200).send({})
});

app.use((err: any, req: Request, res: Response, next: any) => {
    console.error(err);
    if (err instanceof WebhookVerificationError) {
        res.status(400).send({})
    } else {
        res.status(500).send({})
    }
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));