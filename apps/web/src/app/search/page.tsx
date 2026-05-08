import { redirect } from 'next/navigation';

interface SearchPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// Redirect /search?q=... → /products?q=... (forwards all query params)
export default async function SearchPage(props: SearchPageProps) {
  const searchParams = await props.searchParams;
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, v));
    } else {
      params.set(key, value);
    }
  }

  const qs = params.toString();
  redirect(`/products${qs ? `?${qs}` : ''}`);
}
