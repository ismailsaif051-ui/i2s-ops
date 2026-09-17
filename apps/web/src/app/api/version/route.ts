import { NextResponse } from 'next/server';

/**
 * Version déployée du front.
 *
 * Un correctif côté serveur ne change ni le HTML ni les fichiers du
 * navigateur : sans ce repère, on ne peut pas savoir si ce qui répond est
 * bien le dernier commit, et une vérification après déploiement se fait au
 * jugé.
 */
export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json({
    commit: process.env.RENDER_GIT_COMMIT?.slice(0, 7) ?? 'inconnu',
    startedAt: new Date(Date.now() - Math.round(process.uptime() * 1000)).toISOString(),
  });
}
