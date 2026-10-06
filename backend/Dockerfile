FROM php:8.4-cli

# Install dependencies and PostgreSQL PDO driver
RUN apt-get update && apt-get install -y \
    libpq-dev \
    git \
    unzip \
    && docker-php-ext-install pdo pdo_pgsql \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Copy all backend files
COPY . /app

# Create necessary Laravel storage folders and set permissions
RUN mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
    && chmod -R 777 storage bootstrap/cache

# Install production dependencies
RUN composer install --no-dev --optimize-autoloader

# Clear and optimize Laravel cache for production
RUN php artisan config:clear && php artisan cache:clear && php artisan view:clear
RUN php artisan config:cache && php artisan route:cache

# Run migrations then start Laravel server
CMD php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=${PORT:-8000}
