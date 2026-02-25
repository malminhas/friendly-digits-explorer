#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="${SCRIPT_DIR}/terraform"
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
  DROPLET_IP       Remote droplet IP address           (required for remote)
  DROPLET_KEY      Path to SSH private key              (default: terraform/droplet_key)
  BUILD_PLATFORM   Docker buildx platform               (default: auto-detected)

Examples:
  $(basename "$0") local
  $(basename "$0") local friendly-digits-explorer
  DROPLET_IP=1.2.3.4 $(basename "$0") remote friendly-digits-explorer
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

# --- Auto-detect build platform (overridable) ------------------------------

if [[ -z "${BUILD_PLATFORM:-}" ]]; then
    ARCH="$(uname -m)"
    if [[ "$ARCH" == "arm64" || "$ARCH" == "aarch64" ]]; then
        BUILD_PLATFORM="linux/arm64"
    else
        BUILD_PLATFORM="linux/amd64"
    fi
fi

# --- Remote-only: validate droplet credentials -----------------------------

if [[ "$ENVIRONMENT" == "remote" ]]; then
    DROPLET_IP="${DROPLET_IP:-}"
    DROPLET_KEY="${DROPLET_KEY:-${TERRAFORM_DIR}/droplet_key}"

    if [[ -z "$DROPLET_IP" ]]; then
        echo "Error: DROPLET_IP environment variable is required for remote deployment."
        echo "  export DROPLET_IP=<your-droplet-ip>"
        exit 1
    fi

    if [[ ! -f "$DROPLET_KEY" ]]; then
        echo "Error: SSH private key not found at: ${DROPLET_KEY}"
        echo "  Place the key at terraform/droplet_key or set DROPLET_KEY."
        exit 1
    fi
fi

# --- Print summary ---------------------------------------------------------

echo ""
echo "╔═══════════════════════════════════════════════╗"
echo "║  MNIST Neural Network Explorer — Deploy       ║"
echo "╠═══════════════════════════════════════════════╣"
printf "║  %-12s %-32s║\n" "Target:" "$ENVIRONMENT"
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

TF_VARS=(
    -var="environment=${ENVIRONMENT}"
    -var="vite_base=${VITE_BASE}"
    -var="vite_basename=${VITE_BASENAME}"
    -var="build_platform=${BUILD_PLATFORM}"
)

if [[ "$ENVIRONMENT" == "remote" ]]; then
    TF_VARS+=(
        -var="droplet_ip=${DROPLET_IP}"
        -var="private_key_path=${DROPLET_KEY}"
    )
fi

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
