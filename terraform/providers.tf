terraform {
  required_version = ">= 1.0.0"

  required_providers {
    mongodbatlas = {
      source  = "mongodb/mongodbatlas"
      version = "~> 1.10.0"
    }
    netlify = {
      source  = "netlify/netlify"
      version = "~> 0.1.0"
    }
    upstash = {
      source  = "upstash/upstash"
      version = "~> 1.0.0"
    }
  }

  # Remote backend configuration for Terraform Cloud
  # backend "remote" {
  #   organization = "campus-hub"
  #   workspaces {
  #     name = "campus-hub-production"
  #   }
  # }
}

provider "mongodbatlas" {
  public_key  = var.atlas_public_key
  private_key = var.atlas_private_key
}

provider "netlify" {
  token = var.netlify_api_token
}
