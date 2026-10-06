FROM php:8.4-cli

# Install dependencies and PostgreSQL PDO driver
RUN apt-get update && apt-get install -y \
    libpq-dev \
    git \
    unzip \
    && docker-php-ext-install pdo pdo_pgsql \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
