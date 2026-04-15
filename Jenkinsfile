pipeline {
    agent any

    environment {
        DOCKER_CREDENTIALS_ID = "docker-hub-creds"

        BACKEND_IMAGE = "docker.io/dungx2409/backend-app"
        FRONTEND_IMAGE = "docker.io/dungx2409/frontend-app"

        IMAGE_TAG = "${BUILD_NUMBER}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        stage('Build Docker Images') {
            steps {
                script {
                    docker.build("${BACKEND_IMAGE}:${IMAGE_TAG}", "./server")
                    docker.build("${FRONTEND_IMAGE}:${IMAGE_TAG}", "./frontend")
                }
            }
        }

        stage('Login Docker Hub') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: "${DOCKER_CREDENTIALS_ID}",
                    usernameVariable: 'USER',
                    passwordVariable: 'PASS'
                )]) {
                    sh "echo $PASS | docker login -u $USER --password-stdin"
                }
            }
        }

        stage('Push Images') {
            steps {
                script {
                    docker.image("${BACKEND_IMAGE}:${IMAGE_TAG}").push()
                    docker.image("${FRONTEND_IMAGE}:${IMAGE_TAG}").push()
                    docker.image("${BACKEND_IMAGE}:${IMAGE_TAG}").push('latest')
                    docker.image("${FRONTEND_IMAGE}:${IMAGE_TAG}").push('latest')
                }
            }
        }

        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                sh 'docker compose -f docker-compose.yaml up -d --build --remove-orphans'
            }
        }
    }

    post {
        always {
            deleteDir()
        }
        success {
            echo "CI/CD completed successfully."
        }
        failure {
            echo "CI/CD failed. Please check the stage logs above."
        }
    }
}