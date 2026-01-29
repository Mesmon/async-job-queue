provider "azurerm" {
  features {}
}

module "naming" {
  source        = "Azure/naming/azurerm"
  suffix        = ["dev"]
  prefix        = ["mesmon"]
  unique-length = 6 # Adds 6 random chars to globally unique resources (ACR, Redis)
}

resource "azurerm_resource_group" "rg" {
  name     = module.naming.resource_group.name
  location = "italynorth"
}

resource "azurerm_container_registry" "acr" {
  name                = module.naming.container_registry.name_unique
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  sku                 = "Basic"
  admin_enabled       = true
}

# Redis Cache for BullMQ
resource "azurerm_redis_cache" "redis" {
  name                = module.naming.redis_cache.name_unique
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  capacity            = 0 # Size C0 (~250MB) - Cheapest
  family              = "C"
  sku_name            = "Basic"
  minimum_tls_version = "1.2" # Security: Only allow secure connections
}

resource "azurerm_container_app_environment" "env" {
  name                = module.naming.container_app_environment.name
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
}

output "acr_name" {
  value = azurerm_container_registry.acr.name
}

output "acr_password" {
  value     = azurerm_container_registry.acr.admin_password
  sensitive = true
}

output "redis_host" {
  value = azurerm_redis_cache.redis.hostname
}

output "redis_password" {
  value     = azurerm_redis_cache.redis.primary_access_key
  sensitive = true
}

output "resource_group_name" {
  value = azurerm_resource_group.rg.name
}

output "container_app_environment_name" {
  value = azurerm_container_app_environment.env.name
}