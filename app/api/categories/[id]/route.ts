import { getDb } from '@/lib/db/client';
import { deleteCategory, getCategory, updateCategory } from '@/lib/db/repositories/categories';
import { jsonError, jsonOk, readJsonBody } from '@/lib/http/api';
import { rejectUntrustedMutation } from '@/lib/http/guard';
import { logger } from '@/lib/logger';
import { categoryInputSchema, formatIssues } from '@/lib/validation/schemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

/** PATCH /api/categories/[id] — rename a category (sans authentification). */
export async function PATCH(req: Request, context: RouteContext): Promise<Response> {
  try {
    const denied = rejectUntrustedMutation(req);
    if (denied) return denied;

    const { id } = await context.params;
    const body = await readJsonBody(req);
    if (!body.ok) return jsonError(400, 'bad_request', 'Requête invalide : données illisibles.');

    const parsed = categoryInputSchema.safeParse(body.data);
    if (!parsed.success) {
      return jsonError(422, 'validation', 'Certains champs sont invalides.', {
        issues: formatIssues(parsed.error),
      });
    }

    const updated = updateCategory(getDb(), id, parsed.data.name);
    if (!updated) {
      return jsonError(404, 'not_found', 'Cette catégorie n’existe pas (ou plus).');
    }
    logger.info('category updated', { categoryId: id });
    return jsonOk({ category: updated });
  } catch (error) {
    logger.error('updating category failed', { error: (error as Error).message });
    return jsonError(500, 'server_error', 'Une erreur interne est survenue. Veuillez réessayer.');
  }
}

/**
 * DELETE /api/categories/[id] (no login required).
 *
 * Items are never deleted with their category: their association is cleared
 * and the number of affected items is reported to the UI.
 */
export async function DELETE(req: Request, context: RouteContext): Promise<Response> {
  try {
    const denied = rejectUntrustedMutation(req);
    if (denied) return denied;

    const { id } = await context.params;
    const db = getDb();
    if (!getCategory(db, id)) {
      return jsonError(404, 'not_found', 'Cette catégorie n’existe pas (ou plus).');
    }

    const result = deleteCategory(db, id);
    if (!result.deleted) {
      return jsonError(404, 'not_found', 'Cette catégorie n’existe pas (ou plus).');
    }
    logger.info('category deleted', { categoryId: id, detachedItems: result.detachedItems });
    return jsonOk({ ok: true, detachedItems: result.detachedItems });
  } catch (error) {
    logger.error('deleting category failed', { error: (error as Error).message });
    return jsonError(500, 'server_error', 'Une erreur interne est survenue. Veuillez réessayer.');
  }
}
