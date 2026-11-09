import { getCharacters } from "@/lib/api-client";
import { CharacterCard } from "@/components/CharacterCard";
import { PageHeader } from "@/components/PageHeader";
import { RevealGrid } from "@/components/RevealGrid";
import { placeholderCharacters } from "@/lib/placeholders";
import { Container } from "@repo/ui";

export const revalidate = 60;

export default async function CharactersPage() {
  // Published characters from Directus — or the showcase IPs while none exist.
  const fetched = await getCharacters();
  const characters = fetched.length > 0 ? fetched : placeholderCharacters();

  return (
    <>
      <PageHeader title="page.characters" />
      <Container className="py-14">
        <RevealGrid className="grid grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-3 lg:grid-cols-6">
          {characters.map((character, index) => (
            <CharacterCard key={character.id} character={character} index={index} />
          ))}
        </RevealGrid>
      </Container>
    </>
  );
}
