export const ROOMS = [
  {
    id: 'room_living_new_1',
    name: 'New Living Room (Red)',
    category: 'Living',
    imageUrl: '/assets/living_room_2.jpg',
    // TODO: Adjust coordinates to match your image floor
    floorCoordinates: [
      { x: 200, y: 1400 },
      { x: 2400, y: 1400 },
      { x: 2600, y: 2000 },
      { x: 0, y: 2000 }
    ]
  },
  {
    id: 'room_living_new_2',
    name: 'New Living Room (Beige)',
    category: 'Living',
    imageUrl: '/assets/living_room_3.jpg',
    // TODO: Adjust coordinates to match your image floor
    floorCoordinates: [
      { x: 200, y: 1400 },
      { x: 2400, y: 1400 },
      { x: 2600, y: 2000 },
      { x: 0, y: 2000 }
    ]
  },
  {
    id: 'room_living_modern',
    name: 'Modern Living Room',
    category: 'Living',
    imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=2600&auto=format&fit=crop',
    floorCoordinates: [
      { x: 200, y: 1200 },
      { x: 2400, y: 1200 },
      { x: 2600, y: 1780 },
      { x: 0, y: 1780 }
    ]
  },
  {
    id: 'room_kitchen_luxury',
    name: 'Luxury Kitchen',
    category: 'Kitchen',
    imageUrl: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?q=80&w=2600&auto=format&fit=crop',
    floorCoordinates: [
      { x: 400, y: 1300 },
      { x: 2200, y: 1300 },
      { x: 2600, y: 1780 },
      { x: 0, y: 1780 }
    ]
  },
  {
    id: 'room_bathroom_spa',
    name: 'Spa Bathroom',
    category: 'Bathroom',
    imageUrl: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?q=80&w=2600&auto=format&fit=crop',
    floorCoordinates: [
      { x: 100, y: 1000 },
      { x: 2500, y: 1000 },
      { x: 2600, y: 1780 },
      { x: 0, y: 1780 }
    ]
  },
  {
    id: 'room_dining_bright',
    name: 'Bright Dining',
    category: 'Dining',
    imageUrl: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?q=80&w=2600&auto=format&fit=crop',
    floorCoordinates: [
      { x: 300, y: 1100 },
      { x: 2300, y: 1100 },
      { x: 2600, y: 1780 },
      { x: 0, y: 1780 }
    ]
  },
  {
    id: 'room_bedroom_master',
    name: 'Master Bedroom',
    category: 'Bedroom',
    imageUrl: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?q=80&w=2600&auto=format&fit=crop',
    floorCoordinates: [
      { x: 200, y: 1200 },
      { x: 2470, y: 1200 },
      { x: 2670, y: 1780 },
      { x: 0, y: 1780 }
    ]
  },
  // {
  //   id: 'room_hallway_long',
  //   name: 'Grand Hallway',
  //   category: 'Living',
  //   imageUrl: 'https://images.unsplash.com/photo-1505691938895-1758d7fab530?q=80&w=2600&auto=format&fit=crop',
  //   floorCoordinates: [
  //     { x: 800, y: 1100 },
  //     { x: 1800, y: 1100 },
  //     { x: 2600, y: 1780 },
  //     { x: 0, y: 1780 }
  //   ]
  // },
  {
    id: 'room_hallway',
    name: 'Oak Wood',
    category: 'Living',
    imageUrl: 'https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?q=80&w=2670&auto=format&fit=crop',
    floorCoordinates: [
      { x: 800, y: 1100 },
      { x: 1800, y: 1100 },
      { x: 2600, y: 1780 },
      { x: 0, y: 1780 }
    ]
  }
];

export const MATERIALS = [
  {
    id: 'mat_none',
    name: 'None',
    type: 'None',
    textureUrl: null, // Indicates reset
    colorFamily: 'None',
    finish: 'None',
    brightness: 'None',
    category: 'None',
    dimensions: 'N/A',
    coverage: 'N/A'
  },
  {
    id: 'mat_1',
    name: 'Carrara Marble',
    type: 'Marble',
    textureUrl: 'https://images.unsplash.com/photo-1618221639257-2c9430c5e91e?q=80&w=2670&auto=format&fit=crop',
    colorFamily: 'White',
    finish: 'Glossy',
    brightness: 'High',
    category: 'Stone',
    dimensions: '60x120 cm',
    coverage: '1.44 sq.m / box'
  },
  {
    id: 'mat_2',
    dimensions: '60x60 cm',
    coverage: '1.44 sq.m / box',
    name: 'Black Slate',
    type: 'Tile',
    textureUrl: 'https://www.kajariaceramics.com/storage/product/desert-grey.jpg',
    colorFamily: 'Black',
    finish: 'Matte',
    brightness: 'Low',
    category: 'Tile'
  },
  {
    id: 'mat_3',
    dimensions: '80x80 cm',
    coverage: '1.92 sq.m / box',
    name: 'Beige Travertine',
    type: 'Tile',
    textureUrl: 'https://www.kajariaceramics.com/storage/product/desert-crema-1.jpg',
    colorFamily: 'Beige',
    finish: 'Matte',
    brightness: 'Medium',
    category: 'Tile'
  },
  {
    id: 'mat_4',
    dimensions: '30x30 cm',
    coverage: '1.0 sq.m / box',
    name: 'White Ceramic',
    type: 'Tile',
    textureUrl: 'https://www.kajariaceramics.com/storage/product/SPF01018_b.jpg',
    colorFamily: 'White',
    finish: 'Glossy',
    brightness: 'Medium',
    category: 'Tile'
  },
  // {
  //   id: 'mat_5',
  //   dimensions: '15x120 cm',
  //   coverage: '1.44 sq.m / box',
  //   name: 'Oak Wood',
  //   type: 'Wood',
  //   textureUrl: 'https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?q=80&w=2670&auto=format&fit=crop',
  //   colorFamily: 'Brown',
  //   finish: 'Matte',
  //   brightness: 'Medium',
  //   category: 'Panel'
  // },
  {
    id: 'mat_6',
    dimensions: '30x30 cm',
    coverage: '0.9 sq.m / box',
    name: 'Geometric Mosaic',
    type: 'Tile',
    textureUrl: 'https://www.kajariaceramics.com/storage/product/PF01813_b.jpg',
    colorFamily: 'Brown',
    finish: 'Matte',
    brightness: 'High',
    category: 'Tile'
  },
  {
    id: 'mat_9',
    dimensions: '60x120 cm',
    coverage: '1.44 sq.m / box',
    name: 'Grey Concrete',
    type: 'Tile',
    category: 'Tile',
    textureUrl: 'https://www.kajariaceramics.com/storage/product/SPF01020_b.jpg ',
    colorFamily: 'Grey',
    finish: 'Matte',
    brightness: 'Medium'
  },
  {
    id: 'mat_10',
    dimensions: '60x60 cm',
    coverage: '1.44 sq.m / box',
    name: 'Terrazzo Mix',
    type: 'Tile',
    category: 'Tile',
    textureUrl: 'https://www.kajariaceramics.com/storage/product/PF01799_b.jpg',
    colorFamily: 'Galaxy Blue',
    finish: 'Satin',
    brightness: 'High'
  },
  {
    id: 'mat_11',
    dimensions: '120x240 cm',
    coverage: '2.88 sq.m / box',
    name: 'Green Marble',
    type: 'Marble',
    category: 'Stone',
    textureUrl: 'https://images.unsplash.com/photo-1515082186718-d05545f47012?q=80&w=2670&auto=format&fit=crop',
    colorFamily: 'Green',
    finish: 'Glossy',
    brightness: 'Medium'
  },
    {
    id: 'mat_12',
    dimensions: '120x240 cm',
    coverage: '2.88 sq.m / box',
    name: 'Green Marble',
    type: 'Marble',
    category: 'Stone',
    textureUrl: 'https://www.kajariaceramics.com/products/desert-verde?category_ids%5B0%5D=3&filtertype=application&filterid=3&slug_filter_id=3&slug_filter_type=category',
    colorFamily: 'Green',
    finish: 'Matte',
    brightness: 'Medium'
  },
  {
    id: 'mat_13',
    dimensions: '40x60 cm',
    coverage: '0.96 sq.m / box',
    name: 'Rustic Slate',
    type: 'Stone',
    category: 'Stone',
    textureUrl: 'https://images.unsplash.com/photo-1574068307409-5a50785f269a?q=80&w=2576&auto=format&fit=crop',
    colorFamily: 'Brown',
    finish: 'Textured',
    brightness: 'Low'
  }
];

// Helper for Mock Suggestion Logic
export function getSuggestions(currentMaterialId) {
  const current = MATERIALS.find(m => m.id === currentMaterialId);
  if (!current) return [];

  return MATERIALS.filter(m => {
    // Logic: Same color family but different finish, OR high contrast brightness
    const sameColorDiffFinish = m.colorFamily === current.colorFamily && m.finish !== current.finish;
    const contrastBrightness = (current.brightness === 'High' && m.brightness === 'Low') ||
      (current.brightness === 'Low' && m.brightness === 'High');

    return m.id !== current.id && (sameColorDiffFinish || contrastBrightness);
  });
}
