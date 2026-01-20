# **IWAS – Intelligent Workflow Automation System**

 IWAS is a full-stack workflow automation platform built with a React/Vite frontend, a Flask API, and a fully automated DevOps pipeline powered by Docker and GitHub Actions. The project cleanly separates the client, server, and infrastructure layers while keeping deployment and configuration consistent across environments.

---

## **Overview**

The API lives in `api/app`, where `config.py` defines environment-specific settings and `extensions.py` initializes services such as SQLAlchemy, JWT authentication, and other shared components. The domain is modeled in `models.py`, which defines Users, Workflows, Tasks, Logs, and Integrations. Features are organized as Flask blueprints: authentication uses HttpOnly JWT cookies, workflows and tasks support CRUD operations with audit logging and Slack notifications, analytics exposes dashboard and activity data, and integration clients support Slack, GitHub, and Jira actions. Alembic migrations are tracked under `api/migrations`, and database schema and seeds are in `infra/db/sql`.

The frontend in `frontend/src` is built with React, React Router, and an AuthProvider for state management. Axios wrappers in `lib/` unify all server communication, and UI components such as Layout, WorkflowSetup, TaskList, Analytics, Integrations, Notifications, and Settings form the core user interface. Styling is kept intentionally semantic for maintainability.

---

## **Local and Production Environments**

 Local development uses Docker Compose to start the full stack with one command.  
 Production uses the published Docker images so you can run the API on your container host of choice without Kubernetes.

---

## **CI/CD Automation**

 The CI/CD pipeline in `.github/workflows/ci-cd.yml` automates building, testing, and packaging. Every push to `main` triggers linting and tests, then builds Docker images for both the API and frontend. GitHub Actions tags the images with both `latest` and the commit SHA before pushing them to Docker Hub so you can deploy them where you need.

---

## **Summary**

IWAS integrates full-stack development with modern DevOps practices. The project combines clean application architecture, declarative infrastructure, and continuous delivery so environments remain reproducible, configuration stays centralized, and deployments happen reliably on every commit.

