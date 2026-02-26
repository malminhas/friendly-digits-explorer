terraform {
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0"
    }
  }
}

# Local Docker provider
provider "docker" {
  host = "unix:///var/run/docker.sock"
}

# Remote Docker provider for deployment
provider "docker" {
  alias = "remote"
  host  = "ssh://root@${var.droplet_ip}"
  ssh_opts = ["-i", var.private_key_path]
}

# Clean up old resources (environment-specific to avoid cross-affecting local/remote)
resource "null_resource" "cleanup" {
  provisioner "local-exec" {
    command = <<-EOT
      # Always remove stale .tar from previous remote deploys
      rm -f ${var.container_name}.tar
      # Only remove local container/image when deploying locally
      if [ "${var.environment}" = "local" ]; then
        docker rm -f ${var.container_name} 2>/dev/null || true
        docker rmi ${var.container_name}:latest 2>/dev/null || true
      fi
    EOT
  }
}

# Build the image using buildx
resource "null_resource" "build_image" {
  depends_on = [null_resource.cleanup]
  
  provisioner "local-exec" {
    command = "docker buildx build --platform ${var.build_platform} --no-cache -t ${var.container_name}:latest --build-arg VITE_BASE=${var.vite_base} --build-arg VITE_BASENAME=${var.vite_basename} --load .."
  }
}

# Start the container locally
resource "null_resource" "run_local_container" {
  count = var.environment == "local" ? 1 : 0
  depends_on = [null_resource.build_image]

  provisioner "local-exec" {
    command = <<-EOT
      docker rm -f ${var.container_name} 2>/dev/null || true
      docker run -d --name ${var.container_name} -p ${var.host_port}:${var.container_port} --log-driver json-file --log-opt max-size=10m --log-opt max-file=3 ${var.container_name}:latest
    EOT
  }
}

# Make remote resources conditional
resource "null_resource" "save_image" {
  count    = var.environment == "remote" ? 1 : 0
  depends_on = [null_resource.build_image]
  
  provisioner "local-exec" {
    command = "docker save ${var.container_name}:latest > ${var.container_name}.tar"
  }
}

resource "null_resource" "copy_image" {
  count    = var.environment == "remote" ? 1 : 0
  depends_on = [null_resource.save_image]
  
  provisioner "local-exec" {
    command = "scp -i ${var.private_key_path} ${var.container_name}.tar root@${var.droplet_ip}:/root/"
  }
}

resource "null_resource" "load_image" {
  count    = var.environment == "remote" ? 1 : 0
  depends_on = [null_resource.copy_image]
  
  provisioner "remote-exec" {
    connection {
      type        = "ssh"
      user        = "root"
      private_key = file(var.private_key_path)
      host        = var.droplet_ip
    }
    
    inline = [
      "IMAGE_ID=$(docker load < /root/${var.container_name}.tar | awk -F': ' '/Loaded image:/ {print $2}')",
      "docker tag $IMAGE_ID ${var.container_name}:latest"
    ]
  }
}

resource "null_resource" "run_container" {
  count    = var.environment == "remote" ? 1 : 0
  depends_on = [null_resource.load_image]

  provisioner "remote-exec" {
    connection {
      type        = "ssh"
      user        = "root"
      private_key = file(var.private_key_path)
      host        = var.droplet_ip
    }
    inline = [
      "docker rm -f ${var.container_name} 2>/dev/null || true",
      "docker run -d --restart unless-stopped --name ${var.container_name} -p ${var.host_port}:${var.container_port} --log-driver json-file --log-opt max-size=10m --log-opt max-file=3 ${var.container_name}:latest"
    ]
  }
} 