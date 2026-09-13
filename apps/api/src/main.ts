import 'reflect-metadata';
import { Logger, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  app.use(helmet());
  // Un certificat d'étalonnage scanné voyage en base64 : les 100 ko par défaut
  // d'Express ne suffisent pas.
  app.use(json({ limit: '12mb' }));
  app.use(urlencoded({ limit: '12mb', extended: true }));
  // Derrière un reverse proxy (déploiement cloud), pour que `req.ip` soit l'IP réelle.
  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.enableCors({
    origin: config.get<string>('WEB_ORIGIN', 'http://localhost:3000').split(','),
    credentials: true,
  });

  if (config.get('NODE_ENV') !== 'production') {
    const doc = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('I2S OPS — API')
        .setDescription(
          "ERP de gestion opérationnelle, inspection et contrôle de gestion. " +
            'Toutes les routes sont protégées par RBAC sauf mention contraire.',
        )
        .setVersion('0.1.0')
        .addBearerAuth()
        .build(),
    );
    SwaggerModule.setup('api/docs', app, doc);
  }

  const port = config.get<number>('PORT', 4000);
  await app.listen(port);
  logger.log(`API prête sur http://localhost:${port}/api/v1`);
  if (config.get('NODE_ENV') !== 'production') {
    logger.log(`Documentation OpenAPI : http://localhost:${port}/api/docs`);
  }
}

void bootstrap();
