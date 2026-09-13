import { Body, Controller, Get, Module, Param, Post, Put, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { OfferDraftingService } from './offer-drafting.service';
import { draftEditSchema, draftSchema } from './offer-drafting.types';
import { AiModule } from '../ai/ai.module';
import { CurrentUser, RequirePermission } from '../common/decorators';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { RequestUser } from '../common/types';

function ctx(req: Request) {
  return { ip: req.ip ?? null, userAgent: req.headers['user-agent'] ?? null };
}

@ApiTags('Rédaction des offres')
@Controller('offers/:id/redaction')
class OfferDraftingController {
  constructor(private readonly drafting: OfferDraftingService) {}

  @Get()
  @RequirePermission('offer', 'VIEW')
  get(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.drafting.get(user, id);
  }

  /** Rédige le document. L'assistant écrit les mots, jamais les prix. */
  @Post()
  @RequirePermission('offer', 'UPDATE')
  draft(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(draftSchema)) body: z.infer<typeof draftSchema>,
    @Req() req: Request,
  ) {
    return this.drafting.draft(user, id, body.nature, ctx(req));
  }

  /** Les corrections de la personne qui relit. */
  @Put()
  @RequirePermission('offer', 'UPDATE')
  edit(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(draftEditSchema)) body: z.infer<typeof draftEditSchema>,
    @Req() req: Request,
  ) {
    return this.drafting.edit(user, id, body.sections, ctx(req));
  }

  /** La relecture assumée : sans elle, l'offre ne part pas. */
  @Post('validation')
  @RequirePermission('offer', 'UPDATE')
  approve(@CurrentUser() user: RequestUser, @Param('id') id: string, @Req() req: Request) {
    return this.drafting.approve(user, id, ctx(req));
  }
}

@ApiTags('Rédaction des offres')
@Controller('offers/:id/document')
class OfferDocumentController {
  constructor(private readonly drafting: OfferDraftingService) {}

  /** Le document PDF : texte relu, bordereau des prix tiré de la base. */
  @Get()
  @RequirePermission('offer', 'VIEW')
  async pdf(@CurrentUser() user: RequestUser, @Param('id') id: string, @Res() res: Response) {
    const { content, fileName } = await this.drafting.pdf(user, id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', String(content.byteLength));
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    // Une pièce destinée au client ne se met pas en cache chez un intermédiaire.
    res.setHeader('Cache-Control', 'private, no-store');
    res.send(content);
  }
}

@Module({
  imports: [AiModule],
  controllers: [OfferDraftingController, OfferDocumentController],
  providers: [OfferDraftingService],
  exports: [OfferDraftingService],
})
export class OfferDraftingModule {}
