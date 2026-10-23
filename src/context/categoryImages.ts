const imageUrl = (photoId: string, width = 1000) =>
  `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=${width}&q=85`

const categoryImagePools: Record<string, string[]> = {
  tazas: [
    imageUrl('photo-1610701596007-11502861dcfa'),
    imageUrl('photo-1495474472287-4d71bcdd2085'),
  ],
  platos: [
    imageUrl('photo-1578749556568-bc2c40e68b61'),
  ],
  vajillas: [
    imageUrl('photo-1578749556568-bc2c40e68b61'),
    imageUrl('photo-1610701596007-11502861dcfa'),
  ],
  bowls: [
    imageUrl('photo-1578749556568-bc2c40e68b61'),
    imageUrl('photo-1610701596007-11502861dcfa'),
  ],
  banos: [
    imageUrl('photo-1620626011761-996317b8d101'),
  ],
  jarrones: [
    imageUrl('photo-1565193566173-7a0ee3dbe261'),
    imageUrl('photo-1578500494198-246f612d3b3d'),
  ],
  velas: [
    imageUrl('photo-1603006905003-be475563bc59'),
    imageUrl('photo-1602874801007-bd458bb1b8b6'),
  ],
  macetas: [
    imageUrl('photo-1485955900006-10f4d324d411'),
  ],
  decoracion: [
    imageUrl('photo-1578500494198-246f612d3b3d'),
    imageUrl('photo-1565193566173-7a0ee3dbe261'),
  ],
  default: [
    imageUrl('photo-1578749556568-bc2c40e68b61'),
    imageUrl('photo-1610701596007-11502861dcfa'),
    imageUrl('photo-1565193566173-7a0ee3dbe261'),
  ],
}

const categoryAliases: Record<string, string[]> = {
  tazas: ['taza', 'tazas', 'vaso', 'vasos', 'mug'],
  banos: ['baño', 'baños', 'bano', 'banos', 'sanitario'],
  vajillas: ['vajilla', 'vajillas', 'loza'],
  platos: ['plato', 'platos', 'vajilla'],
  bowls: ['bowl', 'bowls', 'tazon', 'cuenco'],
  jarrones: ['jarron', 'jarrones', 'florero', 'floreros', 'jarra'],
  velas: ['vela', 'velas', 'portavela', 'portavelas', 'candelabro', 'candelabros'],
  macetas: ['maceta', 'macetas', 'plantas'],
  decoracion: ['decoracion', 'adorno', 'adornos', 'accesorio', 'accesorios'],
}

export function getCategoryImagePool(categoryName: string): string[] {
  const normalizedName = categoryName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es')
  const matchingCategory = Object.entries(categoryAliases).find(([, aliases]) =>
    aliases.some((alias) => normalizedName.includes(alias)),
  )?.[0]

  return categoryImagePools[matchingCategory ?? 'default']
}

export function getRandomCategoryImage(categoryName: string): string {
  const imagePool = getCategoryImagePool(categoryName)
  return imagePool[Math.floor(Math.random() * imagePool.length)]
}
