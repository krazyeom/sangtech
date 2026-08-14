import SecretPricePreviewClient from './secret-preview-client';

type SecretPageProps = {
  searchParams?: {
    view?: string;
  };
};

export default function SecretPage({ searchParams }: SecretPageProps) {
  const initialView = searchParams?.view === 'sell' ? 'sell' : 'buy';

  return <SecretPricePreviewClient initialView={initialView} />;
}
