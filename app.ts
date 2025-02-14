import express, {Request, Response} from "express";
import {Webhook, WebhookUnbrandedRequiredHeaders, WebhookVerificationError} from "standardwebhooks"

const app = express();
const port = process.env.PORT || 3001;
const renderWebhookSecret = process.env.RENDER_WEBHOOK_SECRET || '';

const renderAPIURL = "https://api.render.com/v1"

// to create a Render API token, follow instructions here: https://render.com/docs/api#1-create-an-api-key
const renderAPIToken = process.env.RENDER_API_TOKEN || '';

interface WebhookData {
    id: string
    serviceId: string
}

interface WebhookPayload {
    type: string
    timestamp: Date
    data: WebhookData
}

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

    const payload: WebhookPayload = JSON.parse(req.body)

    console.log({msg: "received webhook", payload: payload})

    res.status(200).send({})

    handleWebhook(payload)
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

async function handleWebhook(payload: WebhookPayload) {
    if (payload.type === "deploy_ended" || payload.type === "deploy_started") {
        try {
            const service = await fetchServiceInfo(payload)
            console.log(`${payload.type} for service ${service.name}`)
        } catch (error) {
            console.error(error)
        }
    }
}

async function fetchServiceInfo(payload: WebhookPayload) {
    const res = await fetch(
        `${renderAPIURL}/services/${payload.data.serviceId}`,
        {
            method: "get",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${renderAPIToken}`,
            },
        },
    )
    if (res.ok) {
        return res.json()
    } else {
        throw new Error(`unable to fetch service info; received code :${res.status.toString()}`)
    }
}
