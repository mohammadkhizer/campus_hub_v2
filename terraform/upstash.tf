# Note: Upstash provider usage depends on the specific provider implementation.
# This represents the logical resource definition for Redis.

resource "upstash_redis_database" "main" {
  database_name = "campushub-redis-${var.environment}"
  region        = "us-east-1"
  tls           = true
  eviction      = true
}

output "upstash_redis_url" {
  value = "https://${upstash_redis_database.main.endpoint}"
}
