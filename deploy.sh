#!/bin/bash

# Clinic Management System - Deployment Helper Script
# Usage: ./deploy.sh [command] [options]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=${GCP_PROJECT_ID:-""}
REGION="us-central1"
SERVER_IMAGE="clinic-server"
CLIENT_IMAGE="clinic-client"
ARTIFACT_REPO="clinic-repo"

# Functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check requirements
check_requirements() {
    print_header "Checking Requirements"
    
    local missing=0
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        missing=1
    else
        print_success "Docker found"
    fi
    
    if ! command -v firebase &> /dev/null; then
        print_error "Firebase CLI is not installed"
        missing=1
    else
        print_success "Firebase CLI found"
    fi
    
    if ! command -v gcloud &> /dev/null; then
        print_error "Google Cloud SDK is not installed"
        missing=1
    else
        print_success "Google Cloud SDK found"
    fi
    
    if [ $missing -eq 1 ]; then
        echo -e "\n${YELLOW}Install missing tools and try again${NC}"
        exit 1
    fi
}

# Build Docker images locally
build_docker() {
    print_header "Building Docker Images"
    
    print_warning "Building server image..."
    docker build -f server/Dockerfile -t $SERVER_IMAGE:latest ./server
    print_success "Server image built"
    
    print_warning "Building client image..."
    docker build -f client/Dockerfile -t $CLIENT_IMAGE:latest ./client
    print_success "Client image built"
}

# Run Docker compose
docker_up() {
    print_header "Starting Docker Containers"
    
    if [ ! -f ".env.docker" ]; then
        print_error ".env.docker file not found"
        echo "Create .env.docker with required variables"
        exit 1
    fi
    
    docker-compose up -d
    print_success "Containers started"
    
    echo -e "\n${BLUE}Services:${NC}"
    echo "  Frontend: http://localhost:3000"
    echo "  Backend:  http://localhost:4000"
    echo "  Database: localhost:5432"
}

docker_down() {
    print_header "Stopping Docker Containers"
    docker-compose down
    print_success "Containers stopped"
}

docker_logs() {
    print_header "Docker Logs"
    docker-compose logs -f
}

# Firebase deployment
build_frontend() {
    print_header "Building Frontend"
    
    if [ ! -d "client/dist" ]; then
        print_warning "Building React app..."
        cd client
        npm run build
        cd ..
        print_success "Frontend built"
    else
        print_warning "client/dist already exists, skipping build"
    fi
}

deploy_firebase() {
    print_header "Deploying to Firebase Hosting"
    
    if [ -z "$PROJECT_ID" ]; then
        print_error "GCP_PROJECT_ID is not set"
        exit 1
    fi
    
    build_frontend
    
    print_warning "Deploying to Firebase..."
    firebase deploy --only hosting
    print_success "Frontend deployed to Firebase Hosting"
}

# Google Cloud setup
setup_gcp() {
    print_header "Setting Up Google Cloud"
    
    if [ -z "$PROJECT_ID" ]; then
        print_error "Please set GCP_PROJECT_ID environment variable"
        exit 1
    fi
    
    gcloud config set project $PROJECT_ID
    
    print_warning "Enabling required APIs..."
    gcloud services enable run.googleapis.com
    gcloud services enable sqladmin.googleapis.com
    gcloud services enable artifactregistry.googleapis.com
    gcloud services enable cloudbuild.googleapis.com
    
    print_success "Google Cloud APIs enabled"
}

# Push to Artifact Registry
push_images() {
    print_header "Pushing Images to Artifact Registry"
    
    if [ -z "$PROJECT_ID" ]; then
        print_error "GCP_PROJECT_ID is not set"
        exit 1
    fi
    
    # Configure Docker auth
    gcloud auth configure-docker $REGION-docker.pkg.dev
    
    local server_url="$REGION-docker.pkg.dev/$PROJECT_ID/$ARTIFACT_REPO/$SERVER_IMAGE:latest"
    local client_url="$REGION-docker.pkg.dev/$PROJECT_ID/$ARTIFACT_REPO/$CLIENT_IMAGE:latest"
    
    print_warning "Tagging server image..."
    docker tag $SERVER_IMAGE:latest $server_url
    
    print_warning "Pushing server image..."
    docker push $server_url
    print_success "Server image pushed"
    
    print_warning "Tagging client image..."
    docker tag $CLIENT_IMAGE:latest $client_url
    
    print_warning "Pushing client image..."
    docker push $client_url
    print_success "Client image pushed"
    
    echo -e "\n${BLUE}Image URLs:${NC}"
    echo "  Server: $server_url"
    echo "  Client: $client_url"
}

# Deploy to Cloud Run
deploy_cloud_run() {
    print_header "Deploying to Google Cloud Run"
    
    if [ -z "$PROJECT_ID" ]; then
        print_error "GCP_PROJECT_ID is not set"
        exit 1
    fi
    
    local server_url="$REGION-docker.pkg.dev/$PROJECT_ID/$ARTIFACT_REPO/$SERVER_IMAGE:latest"
    
    print_warning "Deploying server to Cloud Run..."
    gcloud run deploy clinic-server \
        --image $server_url \
        --platform managed \
        --region $REGION \
        --allow-unauthenticated \
        --memory 512Mi \
        --timeout 3600
    
    print_success "Server deployed to Cloud Run"
    
    # Get service URL
    local service_url=$(gcloud run services describe clinic-server --region $REGION --format 'value(status.url)')
    echo -e "\n${GREEN}Service URL: $service_url${NC}"
}

# Full deployment
deploy_full() {
    print_header "Full Deployment Pipeline"
    
    check_requirements
    setup_gcp
    build_docker
    push_images
    deploy_cloud_run
    build_frontend
    deploy_firebase
    
    print_success "Full deployment completed!"
}

# Show help
show_help() {
    cat << EOF
${BLUE}Clinic Management System - Deployment Helper${NC}

${YELLOW}Usage:${NC}
    ./deploy.sh [command] [options]

${YELLOW}Commands:${NC}
    check           Check if all required tools are installed
    build           Build Docker images locally
    docker-up       Start Docker containers with docker-compose
    docker-down     Stop Docker containers
    docker-logs     View Docker container logs
    build-frontend  Build React frontend
    deploy-firebase Deploy frontend to Firebase Hosting
    setup-gcp       Set up Google Cloud project
    push-images     Push Docker images to Artifact Registry
    deploy-cloud-run Deploy backend to Google Cloud Run
    deploy-full     Run complete deployment pipeline
    help            Show this help message

${YELLOW}Environment Variables:${NC}
    GCP_PROJECT_ID  Your Google Cloud Project ID (required for GCP commands)

${YELLOW}Examples:${NC}
    GCP_PROJECT_ID=my-project ./deploy.sh setup-gcp
    ./deploy.sh build
    ./deploy.sh docker-up
    GCP_PROJECT_ID=my-project ./deploy.sh deploy-full

${YELLOW}Quick Start:${NC}
    1. Set up GCP: GCP_PROJECT_ID=my-project ./deploy.sh setup-gcp
    2. Build locally: ./deploy.sh build
    3. Test locally: ./deploy.sh docker-up
    4. Deploy: GCP_PROJECT_ID=my-project ./deploy.sh deploy-full

EOF
}

# Main script
main() {
    local command=${1:-help}
    
    case $command in
        check)
            check_requirements
            ;;
        build)
            build_docker
            ;;
        docker-up)
            docker_up
            ;;
        docker-down)
            docker_down
            ;;
        docker-logs)
            docker_logs
            ;;
        build-frontend)
            build_frontend
            ;;
        deploy-firebase)
            deploy_firebase
            ;;
        setup-gcp)
            setup_gcp
            ;;
        push-images)
            push_images
            ;;
        deploy-cloud-run)
            deploy_cloud_run
            ;;
        deploy-full)
            deploy_full
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Unknown command: $command"
            echo "Run './deploy.sh help' for usage information"
            exit 1
            ;;
    esac
}

main "$@"
