# Example Webhook Receiver

This basic example receives webhooks and logs the payload.
It will fetch service, Postgres, or Key Value store information from the RENDER API for certain webhook types.

## Prerequisites
If you haven't already, [sign up for a Render account](https://dashboard.render.com/register).
Creating webhooks on Render requires a Professional plan or higher. You can [view and upgrade your plan](https://dashboard.render.com/billing/update-plan) in the Render Dashboard.

## Deploy to Render

1. Use the button below to deploy to Render </br>
<a href="https://render.com/deploy?repo=https://github.com/render-examples/webhook-receiver/tree/main"><img src="https://render.com/images/deploy-to-render-button.svg" alt="Deploy to Render"></a>

2. Follow [instructions](https://render.com/docs/webhooks) to create a webhook with the URL from your service and `/webhook` path
3. Follow [instructions](https://render.com/docs/api#1-create-an-api-key) to create a Render API Key
4. Set `RENDER_WEBHOOK_SECRET` environment variable to the secret from the webhook created in step 2. SET `RENDER_API_KEY` to the key created in step 3.
5. Trigger a service deploy and watch the webhooks roll in.

## Developing

Once you've created a project and installed dependencies with `pnpm install`, start a development server:

```bash
pnpm run dev
```

## Building

```bash
pnpm run build
```
