import { getCharacters } from "@/lib/api-client";
import { CharacterCard } from "@/components/CharacterCard";
import { PlaceholderCard, placeholderIcon } from "@/components/PlaceholderCard";
import { Reveal } from "@/components/Reveal";
import { RevealGrid } from "@/components/RevealGrid";
import { Container, Section } from "@repo/ui";

export const revalidate = 0;

export default async function CharactersPage() {
  const characters = await getCharacters();

  return (
    <Section>
      <Container>
        <Reveal>
          <h1 className="font-heading text-3xl font-bold">Characters</h1>
        </Reveal>
        <RevealGrid className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {characters.length > 0
            ? characters.map((character) => <CharacterCard key={character.id} character={character} />)
            : Array.from({ length: 8 }).map((_, index) => (
                <PlaceholderCard key={index} icon={placeholderIcon(index)} rounded />
              ))}
        </RevealGrid>
      </Container>
    </Section>
  );
}
