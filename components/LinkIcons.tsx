import { Globe } from 'lucide-react';
import { siGithub, siHuggingface, siYoutube } from 'simple-icons';
import { BrandIcon } from '@/components/BrandIcon';
import type { ListItem } from '@/lib/types';

type LinkKind = 'github' | 'website' | 'huggingface' | 'youtube';

type LinkDefinition = {
  key: string;
  href: string;
  label: string;
  kind: LinkKind;
};

/**
 * Icon links for an item. An icon is rendered ONLY when the corresponding URL
 * exists — empty fields never produce a dead icon. Links open in a new tab
 * with `rel="noopener noreferrer"`.
 */
export function LinkIcons({ item }: { item: ListItem }) {
  const links: LinkDefinition[] = [];
  if (item.githubUrl) {
    links.push({ key: 'github', href: item.githubUrl, label: 'GitHub', kind: 'github' });
  }
  if (item.websiteUrl) {
    links.push({ key: 'website', href: item.websiteUrl, label: 'Site web', kind: 'website' });
  }
  if (item.huggingFaceUrl) {
    links.push({
      key: 'huggingface',
      href: item.huggingFaceUrl,
      label: 'Hugging Face',
      kind: 'huggingface',
    });
  }
  if (item.youtubeUrl) {
    links.push({ key: 'youtube', href: item.youtubeUrl, label: 'YouTube', kind: 'youtube' });
  }

  if (links.length === 0) return null;

  const itemName = item.name?.trim() || 'ressource sans nom';

  return (
    <div className="flex shrink-0 items-center">
      {links.map((link) => (
        <a
          key={link.key}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          title={link.label}
          aria-label={`${link.label} — ${itemName}`}
          className="btn-icon"
        >
          {link.kind === 'website' ? (
            <Globe className="h-[18px] w-[18px]" aria-hidden="true" />
          ) : (
            <BrandIcon
              icon={
                link.kind === 'github'
                  ? siGithub
                  : link.kind === 'huggingface'
                    ? siHuggingface
                    : siYoutube
              }
              className="h-[17px] w-[17px]"
            />
          )}
        </a>
      ))}
    </div>
  );
}
