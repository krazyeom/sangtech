import SecretPricePreviewClient from './secret-preview-client';

type SecretPageProps = {
  searchParams?: {
    view?: string;
  };
};

export default function SecretPage({ searchParams }: SecretPageProps) {
  const initialView = searchParams?.view === 'sell' ? 'sell' : searchParams?.view === 'both' ? 'both' : 'buy';

  return <SecretPricePreviewClient initialView={initialView} />;
}
