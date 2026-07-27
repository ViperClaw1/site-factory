import { getCharacters } from "@/lib/api-client";
import { CharacterCard } from "@/components/CharacterCard";
import { Container, Grid, Section } from "@repo/ui";

export const revalidate = 0;

export default async function CharactersPage() {
  const characters = await getCharacters();

  return (
    <Section>
      <Container>
        <h1 className="font-heading text-3xl font-bold">Characters</h1>
        <Grid cols={4} className="mt-8">
          {characters.map((character) => (
            <CharacterCard key={character.id} character={character} />
          ))}
        </Grid>
      </Container>
    </Section>
  );
}
