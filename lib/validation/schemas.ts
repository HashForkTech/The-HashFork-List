import { z } from 'zod';
import { LIMITS, normalizeUrl } from '@/lib/validation/url';

export { LIMITS, normalizeUrl } from '@/lib/validation/url';

/**
 * All user input is validated server-side with Zod — the client-side checks in
 * the admin UI are only a convenience layer and are never trusted.
 */

const emptyToNull = (value: unknown): unknown =>
  typeof value === 'string' && value.trim() === '' ? null : value;

const optionalText = (max: number) =>
  z.preprocess(emptyToNull, z.string().trim().max(max, `${max} caractères maximum.`).nullish());

const optionalUrlField = () =>
  z
    .preprocess(emptyToNull, z.string().trim().max(LIMITS.url, 'URL trop longue.').nullish())
    .superRefine((value, ctx) => {
      if (value == null) return;
      if (!normalizeUrl(value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'URL invalide (ex. https://exemple.com).',
        });
      }
    });

export const itemInputSchema = z.object({
  categoryId: z.preprocess(emptyToNull, z.string().trim().min(1).max(LIMITS.id).nullish()),
  name: optionalText(LIMITS.name),
  description: optionalText(LIMITS.description),
  githubUrl: optionalUrlField(),
  websiteUrl: optionalUrlField(),
  huggingFaceUrl: optionalUrlField(),
  youtubeUrl: optionalUrlField(),
});

export type ItemInput = z.infer<typeof itemInputSchema>;

export const categoryInputSchema = z.object({
  name: z
    .string({ required_error: 'Champ obligatoire.' })
    .transform((value) => value.trim())
    .pipe(
      z
        .string()
        .min(1, 'Champ obligatoire.')
        .max(LIMITS.category, `${LIMITS.category} caractères maximum.`),
    ),
});

/* -------------------------------------------------------------------------- */
/*                                 Backups                                    */
/* -------------------------------------------------------------------------- */

const optionalTimestamp = z.preprocess(
  emptyToNull,
  z
    .string()
    .trim()
    .max(40)
    .refine((value) => !Number.isNaN(Date.parse(value)), {
      message: 'Date invalide (format ISO attendu).',
    })
    .nullish(),
);

export const backupCategorySchema = z.object({
  id: z.string().trim().min(1).max(LIMITS.id).nullish(),
  name: z
    .string({ required_error: 'Chaque catégorie doit porter un nom.' })
    .transform((value) => value.trim())
    .pipe(z.string().min(1, 'Chaque catégorie doit porter un nom.').max(LIMITS.category)),
  createdAt: optionalTimestamp,
});

export const backupItemSchema = z.object({
  id: z.string().trim().min(1).max(LIMITS.id).nullish(),
  categoryId: z.string().trim().min(1).max(LIMITS.id).nullish(),
  name: optionalText(LIMITS.name),
  description: optionalText(LIMITS.description),
  githubUrl: optionalUrlField(),
  websiteUrl: optionalUrlField(),
  huggingFaceUrl: optionalUrlField(),
  youtubeUrl: optionalUrlField(),
  createdAt: optionalTimestamp,
  updatedAt: optionalTimestamp,
});

export const backupPayloadSchema = z.object({
  categories: z
    .array(backupCategorySchema)
    .max(LIMITS.backupCategories, 'Trop de catégories dans le fichier.'),
  items: z.array(backupItemSchema).max(LIMITS.backupItems, 'Trop de ressources dans le fichier.'),
});

export type BackupCategoryInput = z.infer<typeof backupCategorySchema>;
export type BackupItemInput = z.infer<typeof backupItemSchema>;
export type BackupPayloadInput = z.infer<typeof backupPayloadSchema>;

export const importRequestSchema = z.object({
  mode: z.enum(['merge', 'replace'], {
    errorMap: () => ({ message: 'Mode d’importation invalide (« merge » ou « replace »).' }),
  }),
  confirm: z.boolean().nullish(),
  data: backupPayloadSchema,
});

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

const FIELD_LABELS: Record<string, string> = {
  name: 'Nom',
  description: 'Description',
  categoryId: 'Catégorie',
  githubUrl: 'Lien GitHub',
  websiteUrl: 'Site web',
  huggingFaceUrl: 'Lien Hugging Face',
  youtubeUrl: 'Lien YouTube',
  createdAt: 'Date de création',
  updatedAt: 'Date de modification',
};

/** Turns a ZodError into a flat list of user-facing French messages. */
export function formatIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const segments = issue.path.map(String);
    const leaf = segments[segments.length - 1] ?? '';
    const label = FIELD_LABELS[leaf] ?? (/^\d*$/.test(leaf) ? '' : leaf);
    return label ? `${label} : ${issue.message}` : issue.message;
  });
}
