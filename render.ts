interface WebhookData {
    id: string
    serviceId: string
}

export interface WebhookPayload {
    type: string
    timestamp: Date
    data: WebhookData
}

export interface RenderService {
    id: string
    name: string
    repo: string
    branch: string
}

export interface RenderPostgres {
    id: string
    name: string
}

export interface RenderKeyValue {
    id: string
    name: string
}

interface Commit {
    id: string
    message: string
}

interface Image {
    sha: string
}

export interface RenderDeploy {
    id: string
    commit?: Commit
    image?: Image
}

export interface RenderEvent {
    id: string
    type: string
    details: any
}
