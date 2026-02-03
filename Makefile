.PHONY: help install dev build clean docker-up docker-down db-migrate db-seed

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install all dependencies
	pnpm install

dev: ## Start development servers
	pnpm dev

build: ## Build all packages and apps
	pnpm build

clean: ## Clean all build artifacts and node_modules
	pnpm clean
	find . -name "node_modules" -type d -prune -exec rm -rf {} +

docker-up: ## Start Docker services
	docker-compose up -d

docker-down: ## Stop Docker services
	docker-compose down

docker-logs: ## View Docker logs
	docker-compose logs -f

db-migrate: ## Run database migrations
	pnpm prisma:migrate

db-seed: ## Seed the database
	pnpm --filter @nextpik/database prisma:seed

db-studio: ## Open Prisma Studio
	pnpm --filter @nextpik/database prisma:studio

lint: ## Run linters
	pnpm lint

type-check: ## Run type checking
	pnpm type-check

storybook: ## Start Storybook
	pnpm storybook
