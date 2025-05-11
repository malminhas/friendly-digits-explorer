variable "environment" {
  description = "Deployment environment (local or remote)"
  type        = string
  default     = "local"
}

variable "droplet_ip" {
  description = "DigitalOcean droplet IP address"
  type        = string
  default     = ""
}

variable "private_key_path" {
  description = "Path to the private key for SSH access"
  type        = string
  default     = ""
}

variable "container_name" {
  description = "Name of the container"
  type        = string
  default     = "friendly-digits-explorer"
}

variable "container_port" {
  description = "Port inside the container"
  type        = number
  default     = 8081
}

variable "host_port" {
  description = "Port on the host machine"
  type        = number
  default     = 8081
}

variable "build_platform" {
  description = "Platform to build the Docker image for (e.g., linux/amd64, linux/arm64)"
  type        = string
  default     = "linux/amd64"
} 