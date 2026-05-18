// Tipos que llegan desde el chatbot al backend

export interface MediaFile {
  media_id: string
  mime_type: string
  filename: string
  content_base64: string | null
}

export interface Policy {
  id: number
  policy_number: string
  insurance_type: string
  domain: string
  description: string
}

// POST /api/policy-requests
export interface PolicyRequestBody {
  phone: string
  insurance_type: "auto" | "moto"
  domain: string
  brand: string
  model: string
  year: string
  use: "particular" | "comercial"
  notes: string
}

// POST /api/circulation-card
export interface CirculationCardBody {
  phone: string
  policy_id: number
}

// POST /api/payment-receipts
export interface PaymentReceiptBody {
  phone: string
  policy: Policy
  file: MediaFile
}

// POST /api/claims
export interface ClaimBody {
  phone: string
  policy: Policy
  date: string
  time: string
  place: string
  description: string
  third_parties: string
  driver_license: MediaFile
  vehicle_card: MediaFile
  police_report: MediaFile | null
  additional_files: MediaFile[]
}

// Respuestas
export interface ReferenceResponse {
  reference: string
  status: "ok"
}

export interface ClientResponse {
  id: number
  phone: string
  full_name: string
  active: boolean
}

export interface PolicyListResponse {
  items: Policy[]
}

export interface CirculationCardResponse {
  filename: string
  mime_type: string
  content_base64: string
}
