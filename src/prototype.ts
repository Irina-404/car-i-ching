export type Option = { code: string; text: string };
export type DemoQuestion = { id: string; role: 'core' | 'clarifier' | 'forced'; situation: string; prompt: string; options: Option[] };
export type DemoResult = {
  personTitle: string; personPortrait: string; twinExplanation: string; technicalSpecs: string;
  carName: string; twinIntro: string; photo: string; source: string; preferences: string[];
};

export async function loadDemoResult(signal: AbortSignal): Promise<DemoResult> {
  const names = ['placements', 'vehicles', 'descriptions', 'photos'];
  const [placements, vehicles, descriptions, photos] = await Promise.all(names.map(async name => {
    const response = await fetch(`${import.meta.env.BASE_URL}data/${name}.json`, { signal });
    if (!response.ok) throw new Error(`Не удалось загрузить ${name}.json`);
    return response.json();
  }));
  const code = '000-011';
  const cell = placements.cells?.[code];
  const vehicle = vehicles.items?.[cell?.vehicleId];
  const photo = photos.items?.[cell?.photoId];
  const text = descriptions.results?.[code];
  if (!text || !vehicle || !photo || vehicle.name !== 'Fiat 500 (2007)') {
    throw new Error('В каталоге не найдена демонстрационная карточка Fiat 500 (000-011).');
  }
  for (const key of ['personTitle', 'personPortrait', 'twinExplanation', 'technicalSpecs']) {
    if (typeof text[key] !== 'string' || !text[key].trim()) throw new Error(`В карточке не заполнено поле ${key}.`);
  }
  if (!/^assets\/images\/cars\/[01]{3}-[01]{3}\.webp$/.test(photo.full)) {
    throw new Error('Для карточки требуется локальная фотография.');
  }
  const bits = '000011';
  const wording = [...descriptions.axisWording.row, ...descriptions.axisWording.column];
  const preferences = wording.map((pair: string[], index: number) => pair[Number(bits[index])]);
  if (preferences.length !== 6 || preferences.some((value: unknown) => typeof value !== 'string')) {
    throw new Error('Не удалось прочитать пояснение комбинации.');
  }
  return {
    ...text, carName: vehicle.name, twinIntro: descriptions.resultUi.twinIntro,
    photo: `${import.meta.env.BASE_URL}${photo.full}`, source: photo.source, preferences,
  };
}
