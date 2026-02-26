#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="${SCRIPT_DIR}"
CONTAINER_NAME="friendly-digits-explorer"

usage() {
    cat <<EOF
Usage: $(basename "$0") <local|remote> [subdirectory]

Deploy the MNIST Neural Network Explorer via Docker + Terraform.

Arguments:
  local|remote     Deployment target.
                     local  — build and run the container on this machine.
                     remote — build locally, push to a DigitalOcean droplet via SSH.
  subdirectory     Optional path prefix (e.g. 'friendly-digits-explorer').
                   Omit for root deployment at /.

Environment variables:
  DROPLET_IP       Override droplet IP                 (default: from terraform.tfvars)
  DROPLET_KEY      Override path to SSH key            (default: from terraform.tfvars)

Examples:
  $(basename "$0") local
  $(basename "$0") local friendly-digits-explorer
  $(basename "$0") remote friendly-digits-explorer
EOF
    exit 1
}

# --- Validate arguments ---------------------------------------------------

if [[ $# -lt 1 ]]; then
    usage
fi

ENVIRONMENT="$1"
SUBDIR="${2:-}"

if [[ "$ENVIRONMENT" != "local" && "$ENVIRONMENT" != "remote" ]]; then
    echo "Error: first argument must be 'local' or 'remote'"
    echo ""
    usage
fi

# --- Derive Vite paths from subdirectory -----------------------------------

if [[ -n "$SUBDIR" ]]; then
    SUBDIR="${SUBDIR#/}"   # strip leading slash
    SUBDIR="${SUBDIR%/}"   # strip trailing slash
    VITE_BASE="/${SUBDIR}/"
    VITE_BASENAME="/${SUBDIR}"
else
    VITE_BASE="/"
    VITE_BASENAME="/"
fi

# --- Build platform: local = Mac native, remote = linux/amd64 --------------

if [[ "$ENVIRONMENT" == "local" ]]; then
    ARCH="$(uname -m)"
    if [[ "$ARCH" == "arm64" || "$ARCH" == "aarch64" ]]; then
        BUILD_PLATFORM="linux/arm64"
    else
        BUILD_PLATFORM="linux/amd64"
    fi
else
    BUILD_PLATFORM="linux/amd64"
fi

# --- Remote-only: load droplet config from terraform.tfvars ------------------

if [[ "$ENVIRONMENT" == "remote" ]]; then
    TFVARS="${TERRAFORM_DIR}/terraform.tfvars"
    if [[ -f "$TFVARS" ]]; then
        # Extract droplet_ip and private_key_path from terraform.tfvars (env vars override)
        [[ -z "${DROPLET_IP:-}" ]] && DROPLET_IP=$(grep -E '^\s*droplet_ip\s*=' "$TFVARS" | sed -E 's/.*"([^"]+)"[[:space:]]*$/\1/')
        [[ -z "${DROPLET_KEY:-}" ]] && DROPLET_KEY=$(grep -E '^\s*private_key_path\s*=' "$TFVARS" | sed -E 's/.*"([^"]+)"[[:space:]]*$/\1/')
        # Resolve relative private_key_path relative to terraform dir
        [[ -n "$DROPLET_KEY" && "$DROPLET_KEY" != /* ]] && DROPLET_KEY="${TERRAFORM_DIR}/${DROPLET_KEY}"
    fi
    DROPLET_KEY="${DROPLET_KEY:-${TERRAFORM_DIR}/droplet_key}"

    if [[ -z "$DROPLET_IP" ]]; then
        echo "Error: droplet_ip required for remote deployment."
        echo "  Set it in terraform/terraform.tfvars or export DROPLET_IP=<your-droplet-ip>"
        exit 1
    fi

    if [[ ! -f "$DROPLET_KEY" ]]; then
        echo "Error: SSH private key not found at: ${DROPLET_KEY}"
        echo "  Set private_key_path in terraform/terraform.tfvars or place key at terraform/droplet_key"
        exit 1
    fi
fi

# --- Print summary ---------------------------------------------------------

echo ""
echo "╔═══════════════════════════════════════════════╗"
echo "║  MNIST Neural Network Explorer — Deploy       ║"
echo "╠═══════════════════════════════════════════════╣"
printf "║  %-12s %-32s║\n" "Target:" "$ENVIRONMENT"
printf "║  %-12s %-32s║\n" "Container:" "${CONTAINER_NAME} (port 8081)"
printf "║  %-12s %-32s║\n" "Subdir:" "${SUBDIR:-  (none — root)}"
printf "║  %-12s %-32s║\n" "VITE_BASE:" "$VITE_BASE"
printf "║  %-12s %-32s║\n" "BASENAME:" "$VITE_BASENAME"
printf "║  %-12s %-32s║\n" "Platform:" "$BUILD_PLATFORM"
if [[ "$ENVIRONMENT" == "remote" ]]; then
    printf "║  %-12s %-32s║\n" "Droplet:" "$DROPLET_IP"
    printf "║  %-12s %-32s║\n" "SSH key:" "$DROPLET_KEY"
fi
echo "╚═══════════════════════════════════════════════╝"
echo ""

# --- Build terraform variable list -----------------------------------------
# droplet_ip and private_key_path are loaded by terraform from terraform.tfvars
TF_VARS=(
    -var="environment=${ENVIRONMENT}"
    -var="container_name=${CONTAINER_NAME}"
    -var="host_port=8081"
    -var="container_port=8081"
    -var="vite_base=${VITE_BASE}"
    -var="vite_basename=${VITE_BASENAME}"
    -var="build_platform=${BUILD_PLATFORM}"
)

# --- Run Terraform ---------------------------------------------------------

cd "$TERRAFORM_DIR"

# null_resource provisioners only run on creation, so clear previous state
# to ensure a full rebuild every deploy.
rm -f terraform.tfstate terraform.tfstate.backup

terraform init -input=false

echo ""
echo "Running terraform apply …"
echo ""
terraform apply -auto-approve -input=false "${TF_VARS[@]}"

# --- Done ------------------------------------------------------------------

echo ""
echo "╔═══════════════════════════════════════════════╗"
echo "║  Deployment complete!                         ║"
echo "╠═══════════════════════════════════════════════╣"
if [[ "$ENVIRONMENT" == "local" ]]; then
    if [[ -n "$SUBDIR" ]]; then
        URL="http://localhost:8081/${SUBDIR}/"
    else
        URL="http://localhost:8081/"
    fi
    printf "║  %-44s║\n" "Container: ${CONTAINER_NAME}"
    printf "║  %-44s║\n" "URL: ${URL}"
else
    printf "║  %-44s║\n" "Deployed to: ${DROPLET_IP}"
    if [[ -n "$SUBDIR" ]]; then
        printf "║  %-44s║\n" "Served at subpath: /${SUBDIR}/"
        printf "║  %-44s║\n" "(via your reverse proxy)"
    else
        URL="http://${DROPLET_IP}:8081/"
        printf "║  %-44s║\n" "URL: ${URL}"
    fi
fi
echo "╚═══════════════════════════════════════════════╝"
echo ""
