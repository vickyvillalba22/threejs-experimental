import HomeOficial from "@/components/HomeOficial";

export default async function Home({ searchParams }) {
  const params = await searchParams;
  return <HomeOficial devTarget={params?.dev || ""} />;
}
