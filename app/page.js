import HomeExperience from "@/components/HomeExperience";

export default async function Home({ searchParams }) {
  const params = await searchParams;
  return <HomeExperience devTarget={params?.dev || ""} />;
}
