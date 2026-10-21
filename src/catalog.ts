export type ResultData = {
  code: string; bits: string;
  personTitle: string; personPortrait: string; twinExplanation: string; technicalSpecs: string;
  carName: string; twinIntro: string; photo: string; source: string; author: string; license: string; preferences: string[];
};
type CatalogInput = {
  structure: { bitOrder: number[]; axes: { row: { id: string; position: number }[]; column: { id: string; position: number }[] } };
  placements: { cells: Record<string, { vehicleId: string; photoId: string }> };
  vehicles: { items: Record<string, { name: string }> };
  photos: { items: Record<string, { full: string; source: string; author?: string; license?: string }> };
  descriptions: { results: Record<string, { personTitle: string; personPortrait: string; twinExplanation: string; technicalSpecs: string }>;
    axisWording: { row: string[][]; column: string[][] }; resultUi: { twinIntro: string } };
};
export type Catalog = Record<string, ResultData>;

export function validateCatalog(input: unknown): Catalog {
  const data = input as CatalogInput;
  const fail = (detail: string): never => { throw new Error(`Каталог повреждён: ${detail}.`); };
  if (!data?.structure || !data.placements?.cells || !data.vehicles?.items || !data.photos?.items || !data.descriptions?.results) return fail('нет обязательных данных');
  const expectedIds = ['taskScale', 'temperament', 'environment', 'approach', 'priority', 'expression'];
  const axes = [...(data.structure.axes?.row ?? []), ...(data.structure.axes?.column ?? [])];
  if (JSON.stringify(data.structure.bitOrder) !== '[1,2,3]' || axes.length !== 6 || axes.some((axis, i) => axis.id !== expectedIds[i] || axis.position !== i % 3 + 1)) return fail('порядок осей');
  const wording = [...(data.descriptions.axisWording?.row ?? []), ...(data.descriptions.axisWording?.column ?? [])];
  if (wording.length !== 6 || wording.some(pair => !Array.isArray(pair) || pair.length !== 2 || pair.some(text => typeof text !== 'string' || !text.trim()))) return fail('пояснения осей');
  if (typeof data.descriptions.resultUi?.twinIntro !== 'string' || !data.descriptions.resultUi.twinIntro.trim()) return fail('вводная фраза');
  if (Object.keys(data.placements.cells).length !== 64 || Object.keys(data.descriptions.results).length !== 64) return fail('ожидалось 64 результата');
  const catalog: Catalog = {};
  const vehicles = new Set<string>();
  for (let i = 0; i < 64; i++) {
    const bits = i.toString(2).padStart(6, '0');
    const code = `${bits.slice(0, 3)}-${bits.slice(3)}`;
    const cell = data.placements.cells[code];
    const vehicle = data.vehicles.items[cell?.vehicleId];
    const photo = data.photos.items[cell?.photoId];
    const text = data.descriptions.results[code];
    if (!cell || !vehicle || !photo || !text || vehicles.has(cell.vehicleId)) return fail(`связи или повторное назначение ${code}`);
    vehicles.add(cell.vehicleId);
    if ([vehicle.name, text.personTitle, text.personPortrait, text.twinExplanation, text.technicalSpecs].some(value => typeof value !== 'string' || !value.trim())) return fail(`пустые поля ${code}`);
    if (typeof photo.full !== 'string' || !/^assets\/images\/cars\/[01]{3}-[01]{3}\.webp$/.test(photo.full)) return fail(`локальная фотография ${code}`);
    catalog[code] = { ...text, code, bits, carName: vehicle.name, twinIntro: data.descriptions.resultUi.twinIntro,
      photo: photo.full, source: photo.source || '', author: photo.author || '', license: photo.license || '',
      preferences: wording.map((pair, index) => pair[Number(bits[index])]),
    };
  }
  return catalog;
}

export function lookupCar(bits: string, catalog: Catalog): ResultData {
  if (!/^[01]{6}$/.test(bits)) throw new Error('Неверный шестибитный профиль.');
  const code = `${bits.slice(0, 3)}-${bits.slice(3)}`;
  if (!catalog[code]) throw new Error(`В каталоге не найдена карточка ${code}.`);
  return catalog[code];
}
