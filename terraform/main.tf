terraform {
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0"
    }
  }
}

provider "docker" {}

resource "docker_image" "webapp" {
  name = "friendly-digits-explorer:latest"
  build {
    context = ".."
    dockerfile = "Dockerfile"
  }
}

resource "docker_container" "webapp" {
  name  = "friendly-digits-explorer"
  image = docker_image.webapp.image_id
  ports {
    internal = 8081
    external = 8081
  }
  
  # Add logging configuration
  log_driver = "json-file"
  log_opts = {
    "max-size" = "10m"
    "max-file" = "3"
  }
} 