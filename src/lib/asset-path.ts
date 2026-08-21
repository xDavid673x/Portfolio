/**
 * Prefix a public asset with the repository path used by GitHub Pages.
 * Local development keeps the normal root-relative URL.
 */
export function assetPath(path: string) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${basePath}${normalizedPath}`;
}
