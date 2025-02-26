import express, {NextFunction, Request, Response} from "express";
import {Webhook, WebhookUnbrandedRequiredHeaders, WebhookVerificationError} from "standardwebhooks"
import {RenderDeploy, RenderEvent, RenderKeyValue, RenderPostgres, RenderService, WebhookPayload} from "./render";

const app = express();
const port = process.env.PORT || 3001;
const renderWebhookSecret = process.env.RENDER_WEBHOOK_SECRET || '';
if (!renderWebhookSecret ) {
    console.error("Error: RENDER_WEBHOOK_SECRET is not set.");
    process.exit(1);
}

const renderAPIURL = process.env.RENDER_API_URL || "https://api.render.com/v1"

// To create a Render API token, follow instructions here: https://render.com/docs/api#1-create-an-api-key
const renderAPIKey = process.env.RENDER_API_KEY || '';
if (!renderAPIKey ) {
    console.error("Error: RENDER_API_KEY is not set.");
    process.exit(1);
}

app.post("/webhook", express.raw({type: 'application/json'}), (req: Request, res: Response, next: NextFunction) => {
    try {
        validateWebhook(req);
    } catch (error) {
       return next(error)
    }

    const payload: WebhookPayload = JSON.parse(req.body)

    res.status(200).send({}).end()

    // handle the webhook async so we don't timeout the request
    handleWebhook(payload)
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err);
    if (err instanceof WebhookVerificationError) {
        res.status(400).send({}).end()
    } else {
        res.status(500).send({}).end()
    }
});

const server = app.listen(port, () => console.log(`Example app listening on port ${port}!`));

function validateWebhook(req: Request) {
    const headers: WebhookUnbrandedRequiredHeaders = {
        "webhook-id": req.header("webhook-id") || "",
        "webhook-timestamp": req.header("webhook-timestamp") || "",
        "webhook-signature": req.header("webhook-signature") || ""
    }

    const wh = new Webhook(renderWebhookSecret);
    wh.verify(req.body, headers);
}

async function handleWebhook(payload: WebhookPayload) {
    try {
        switch (payload.type) {
            case "deploy_started":
                const event = await fetchEventInfo(payload)
                const deploy = await fetchDeployInfo(payload.data.serviceId, event.details.deployId)
                const service = await fetchServiceInfo(payload)

                if (deploy.commit) {
                    console.log(`deploy started for service ${service.name} with commit "${deploy.commit.message}"`)
                } else if (deploy.image) {
                    console.log(`deploy started for service ${service.name} with image sha "${deploy.image.sha}"`)
                }
                return
            case "database_available":
                const postgres = await fetchPostgresInfo(payload)
                console.log(`${payload.type} for postgres ${postgres.name}`)
                return
            case "key_value_available":
                const keyValue = await fetchKeyValueInfo(payload)
                console.log(`${payload.type} for key value ${keyValue.name}`)
                return
            default:
                console.log(`unhandled webhook type ${payload.type} for service ${payload.data.serviceId}`)
        }
    } catch (error) {
        console.error(error)
    }
}

// fetchEventInfo fetches the event that triggered the webhook
// some events have additional information that isn't in the webhook payload
// for example, deploy events have the deploy id
async function fetchEventInfo(payload: WebhookPayload): Promise<RenderEvent> {
    const res = await fetch(
        `${renderAPIURL}/events/${payload.data.id}`,
        {
            method: "get",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${renderAPIKey}`,
            },
        },
    )
    if (res.ok) {
        return res.json()
    } else {
        throw new Error(`unable to fetch event info; received code :${res.status.toString()}`)
    }
}

async function fetchDeployInfo(serviceId: string, deployId: string): Promise<RenderDeploy> {
    const res = await fetch(
        `${renderAPIURL}/services/${serviceId}/deploys/${deployId}`,
        {
            method: "get",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${renderAPIKey}`,
            },
        },
    )
    if (res.ok) {
        return res.json()
    } else {
        throw new Error(`unable to fetch deploy info; received code :${res.status.toString()}`)
    }
}

async function fetchServiceInfo(payload: WebhookPayload): Promise<RenderService> {
    const res = await fetch(
        `${renderAPIURL}/services/${payload.data.serviceId}`,
        {
            method: "get",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${renderAPIKey}`,
            },
        },
    )
    if (res.ok) {
        return res.json()
    } else {
        throw new Error(`unable to fetch service info; received code :${res.status.toString()}`)
    }
}


async function fetchPostgresInfo(payload: WebhookPayload): Promise<RenderPostgres> {
    const res = await fetch(
        `${renderAPIURL}/postgres/${payload.data.serviceId}`,
        {
            method: "get",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${renderAPIKey}`,
            },
        },
    )
    if (res.ok) {
        return res.json()
    } else {
        throw new Error(`unable to fetch postgres info; received code :${res.status.toString()}`)
    }
}


async function fetchKeyValueInfo(payload: WebhookPayload): Promise<RenderKeyValue> {
    const res = await fetch(
        `${renderAPIURL}/key-value/${payload.data.serviceId}`,
        {
            method: "get",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${renderAPIKey}`,
            },
        },
    )
    if (res.ok) {
        return res.json()
    } else {
        throw new Error(`unable to fetch key value info; received code :${res.status.toString()}`)
    }
}

process.on('SIGTERM', () => {
    console.debug('SIGTERM signal received: closing HTTP server')
    server.close(() => {
        console.debug('HTTP server closed')
    })
})
