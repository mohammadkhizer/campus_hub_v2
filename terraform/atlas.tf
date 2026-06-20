resource "mongodbatlas_cluster" "campus_hub" {
  project_id   = var.atlas_project_id
  name         = "campushub-${var.environment}"
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

  cloud_backup                 = true
  auto_scaling_disk_gb_enabled = true
  mongo_db_major_version       = "6.0"

  # Provider Instance Size Name (e.g. M10, M20)
  provider_name               = "AWS"
  provider_instance_size_name = "M10"
}

resource "mongodbatlas_database_user" "app_user" {
  username           = "campushub-app"
  password           = var.atlas_db_password
  project_id         = var.atlas_project_id
  auth_database_name = "admin"

  roles {
    role_name     = "readWrite"
    database_name = "campushub"
  }
}

variable "atlas_db_password" {
  type      = string
  sensitive = true
}
