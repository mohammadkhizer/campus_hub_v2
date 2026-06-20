variable "atlas_project_id" {
  description = "The MongoDB Atlas Project ID"
  type        = string
}

variable "atlas_public_key" {
  description = "The public API key for MongoDB Atlas"
  type        = string
  sensitive   = true
}

variable "atlas_private_key" {
  description = "The private API key for MongoDB Atlas"
  type        = string
  sensitive   = true
}

variable "netlify_api_token" {
  description = "The Netlify Personal Access Token"
  type        = string
  sensitive   = true
}

variable "upstash_api_key" {
  description = "The Upstash API Key"
  type        = string
  sensitive   = true
}

variable "environment" {
  description = "Deployment environment (e.g., production, staging)"
  type        = string
  default     = "production"
}
