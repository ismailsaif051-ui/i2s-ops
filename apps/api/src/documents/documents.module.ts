import { Controller, Get, Global, Module, Param, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { z } from 'zod';
import { DocumentsService } from './documents.service';
import { StorageService } from '../storage/storage.service';
import { CurrentUser, RequirePermission } from '../common/decorators';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { RequestUser } from '../common/types';

const listSchema = z.object({
  type: z.string().trim().max(40).optional(),
  affairId: z.string().uuid().optional(),
  q: z.string().trim().max(120).optional(),
  limit: z.coerce.number().int().min(1).max(300).default(100),
});

/** Nom de fichier sûr pour un en-tête HTTP. */
function contentDisposition(fileName: string): string {
  const ascii = fileName.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '');
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

@ApiTags('GED')
@Controller('documents')
class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Get()
  @RequirePermission('document', 'VIEW')
  async list(
    @CurrentUser() user: RequestUser,
    @Query(new ZodValidationPipe(listSchema)) query: z.infer<typeof listSchema>,
  ) {
    const rows = await this.documents.list(user, query);

    return {
      items: rows.map((d) => ({
        id: d.id,
        type: d.type,
        fileName: d.fileName,
        mimeType: d.mimeType,
        size: d.size,
        sha256: d.sha256,
        confidentiality: d.confidentiality,
        entityType: d.entityType,
        entityId: d.entityId,
        affair: d.affair ? { number: d.affair.number, client: d.affair.client.name } : null,
        versionCount: d._count.versions,
        createdAt: d.createdAt,
      })),
    };
  }

  @Get(':id')
  @RequirePermission('document', 'VIEW')
  async detail(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const document = await this.documents.get(user, id);

    return {
      id: document.id,
      type: document.type,
      fileName: document.fileName,
      mimeType: document.mimeType,
      size: document.size,
      sha256: document.sha256,
      confidentiality: document.confidentiality,
      entityType: document.entityType,
      entityId: document.entityId,
      createdAt: document.createdAt,
      versions: document.versions.map((v) => ({
        version: v.version,
        size: v.size,
        sha256: v.sha256,
        comment: v.comment,
        createdAt: v.createdAt,
      })),
    };
  }

  @Get(':id/contenu')
  @RequirePermission('document', 'DOWNLOAD')
  async download(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const { document, content } = await this.documents.download(user, id);

    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Length', String(content.byteLength));
    res.setHeader('Content-Disposition', contentDisposition(document.fileName));
    // Une pièce remise au client ne se met pas en cache chez un intermédiaire.
    res.setHeader('Cache-Control', 'private, no-store');
    res.send(content);
  }
}

/**
 * Global : le dépôt de documents sert à plusieurs modules (rapports, ordres de
 * mission, attachements) sans qu'ils aient à s'importer les uns les autres.
 */
@Global()
@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService, StorageService],
  exports: [DocumentsService, StorageService],
})
export class DocumentsModule {}
