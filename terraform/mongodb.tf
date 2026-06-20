terraform {
  required_providers {
    mongodbatlas = {
      source  = "mongodb/mongodbatlas"
      version = "~> 1.8.0"
    }
  }
}

provider "mongodbatlas" {
  public_key  = var.atlas_public_key
  private_key = var.atlas_private_key
}

resource "mongodbatlas_project" "campushub" {
  name   = "CampusHub-v2"
  org_id = var.atlas_org_id
}

resource "mongodbatlas_cluster" "production" {
  project_id   = mongodbatlas_project.campushub.id
  name         = "CampusHub-Production"
  cluster_type = "REPLICASET"
  replication_specs {
    num_shards = 1
    regions_config {
      region_name     = "US_EAST_1"
      electable_nodes = 3
      priority        = 7
      read_only_nodes = 0
    }
  }
  cloud_backup      = true
  auto_scaling_compute_enabled = true
  provider_name               = "AWS"
  provider_instance_size_name = "M10"
}

output "connection_string" {
  value = mongodbatlas_cluster.production.connection_strings[0].standard_srv
}
