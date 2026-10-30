// Supernova template data.
//
// Everything here is PLACEHOLDER content for the template: menu items,
// prices, popularity counts, fees and campuses. In production these come
// from the API (GET /vendors, GET /menu?vendor=, GET /menu/popular) and the
// server is the only thing that decides prices and totals.
window.SN = window.SN || {};

SN.KITCHENS = {
  crunchies: {
    id: 'crunchies',
    name: 'Crunchies',
    tagline: 'Crisp, hot and quick.',
    blurb: 'Fried chicken, wings, shawarma and burgers. The late-night study fuel.',
    hours: '10:00 – 22:00',
    eta: '25–40 min',
    fee: 800,
    hero: 'assets/img/crunchy-chicken.webp',
    alt: 'Crispy fried chicken on a banana leaf'
  },
  roots: {
    id: 'roots',
    name: 'Roots',
    tagline: 'Home cooking, done properly.',
    blurb: 'Party jollof, soups and swallow, grills and small chops. Food that tastes like a weekend at home.',
    hours: '09:00 – 21:00',
    eta: '35–50 min',
    fee: 800,
    hero: 'assets/img/jollof-spread.webp',
    alt: 'Jollof rice, grilled fish and skewers on a table'
  }
};

// Option groups: `one` is a required single choice, `many` is optional extras.
const SPICE = { id: 'spice', name: 'How hot?', type: 'one', options: [
  { id: 'mild', label: 'Mild', price: 0 },
  { id: 'hot', label: 'Hot', price: 0 },
  { id: 'fire', label: 'Fire', price: 0 }
] };
const SWALLOW = { id: 'swallow', name: 'Choose your swallow', type: 'one', options: [
  { id: 'poundo', label: 'Pounded yam', price: 0 },
  { id: 'eba', label: 'Eba', price: 0 },
  { id: 'semo', label: 'Semo', price: 0 },
  { id: 'amala', label: 'Amala', price: 200 }
] };

SN.MENU = {
  crunchies: {
    categories: [
      { id: 'chicken', name: 'Chicken' },
      { id: 'wraps', name: 'Wraps & burgers' },
      { id: 'sides', name: 'Sides & sharing' },
      { id: 'drinks', name: 'Shakes' }
    ],
    items: [
      { id: 'crunchy-3', cat: 'chicken', name: 'Crunchy Chicken, 3 pieces', desc: 'Our signature crunch. Crisp outside, juicy inside, seasoned all the way through.', price: 5200, img: 'crunchy-chicken', orders: 1840,
        groups: [SPICE, { id: 'extras', name: 'Add extras', type: 'many', options: [
          { id: 'piece', label: 'Extra piece', price: 1500 }, { id: 'dip', label: 'Spicy dip', price: 300 }, { id: 'slaw', label: 'Coleslaw', price: 700 }] }] },
      { id: 'wings-6', cat: 'chicken', name: 'Hot Wings, 6 pieces', desc: 'Sticky, spicy wings with a cooling garlic dip.', price: 5800, img: 'wings', orders: 1310, groups: [SPICE] },
      { id: 'chicken-strips', cat: 'chicken', name: 'Chicken Strips & Dip', desc: 'Five tender strips, golden crumb, creamy dip.', price: 4600, img: 'chicken-dip', orders: 690 },
      { id: 'wings-basket', cat: 'chicken', name: 'Wings Basket, 10 pieces', desc: 'Ten wings and a ranch pot. Made for sharing, rarely shared.', price: 9200, img: 'wings-basket', orders: 540, groups: [SPICE] },
      { id: 'bucket', cat: 'chicken', name: 'Family Bucket, 8 pieces', desc: 'Eight pieces and four soft rolls. Bring your floor.', price: 13500, img: 'family-bucket', orders: 620 },
      { id: 'shawarma', cat: 'wraps', name: 'Chicken Shawarma', desc: 'Double chicken, creamy garlic, toasted wrap.', price: 4500, img: 'shawarma', orders: 1520,
        groups: [{ id: 'extras', name: 'Add extras', type: 'many', options: [
          { id: 'chicken', label: 'Extra chicken', price: 1200 }, { id: 'sausage', label: 'Sausage', price: 500 }, { id: 'cheese', label: 'Cheese', price: 400 }] }] },
      { id: 'shawarma-beef', cat: 'wraps', name: 'Beef Shawarma', desc: 'Spiced beef, pickled onion, fresh tomato, garlic sauce.', price: 5000, img: 'shawarma-beef', orders: 760 },
      { id: 'burger', cat: 'wraps', name: 'Classic Beef Burger', desc: 'Beef patty, cheese, house sauce. Comes with fries.', price: 5500, img: 'burger', orders: 880 },
      { id: 'burger-double', cat: 'wraps', name: 'Double Stack', desc: 'Two patties, double cheese, caramelised onion.', price: 7800, img: 'burger-double', orders: 410, soldOut: true },
      { id: 'fries', cat: 'sides', name: 'Loaded Fries', desc: 'Crisp fries, spicy seasoning, garlic dip.', price: 2500, img: 'fries', orders: 990 },
      { id: 'pizza', cat: 'sides', name: 'Suya Chicken Pizza', desc: 'Suya-spiced chicken, peppers and onion on a thin crust.', price: 8500, img: 'pizza', orders: 350 },
      { id: 'shake-oreo', cat: 'drinks', name: 'Cookies & Cream Shake', desc: 'Thick, cold, topped with crushed cookies.', price: 3200, img: 'shake', orders: 700 },
      { id: 'shake-straw', cat: 'drinks', name: 'Strawberry Shake', desc: 'Real strawberries, vanilla ice cream.', price: 3200, img: 'strawberry-shake', orders: 460 }
    ]
  },
  roots: {
    categories: [
      { id: 'rice', name: 'Rice' },
      { id: 'soups', name: 'Soups & swallow' },
      { id: 'grills', name: 'Grills & small chops' },
      { id: 'drinks', name: 'Smoothies' }
    ],
    items: [
      { id: 'jollof-skewers', cat: 'rice', name: 'Party Jollof & Skewers', desc: 'Smoky firewood-style jollof, two grilled chicken skewers, fried plantain.', price: 6500, img: 'jollof-skewers', orders: 2100,
        groups: [{ id: 'extras', name: 'Add extras', type: 'many', options: [
          { id: 'dodo', label: 'Extra plantain', price: 600 }, { id: 'skewer', label: 'Extra skewer', price: 1400 }, { id: 'moi', label: 'Moi moi', price: 900 }] }] },
      { id: 'jollof-chicken', cat: 'rice', name: 'Jollof & Fried Chicken', desc: 'Party jollof with a quarter fried chicken, coleslaw on the side.', price: 6000, img: 'hero-jollof-chicken', orders: 1650 },
      { id: 'rice-stew', cat: 'rice', name: 'Rice, Stew & Egg', desc: 'White rice, rich tomato stew, boiled egg, crispy chicken.', price: 5500, img: 'rice-stew-egg', orders: 920 },
      { id: 'ofada', cat: 'rice', name: 'Rice & Beef Stew', desc: 'Steamed rice, slow-cooked beef in pepper stew, fresh salad.', price: 6200, img: 'ofada-stew', orders: 610 },
      { id: 'jollof-fish', cat: 'rice', name: 'Jollof & Grilled Fish', desc: 'A whole grilled fish over jollof, peppered and charred.', price: 7500, img: 'jollof-spread', orders: 540 },
      { id: 'egusi', cat: 'soups', name: 'Egusi & Assorted', desc: 'Rich egusi soup with assorted meat.', price: 7000, img: 'egusi', orders: 1180, groups: [SWALLOW] },
      { id: 'efo', cat: 'soups', name: 'Efo Riro', desc: 'Spinach stew with peppers, locust beans and assorted meat.', price: 6800, img: 'efo-riro', orders: 640, groups: [SWALLOW] },
      { id: 'pepper-soup', cat: 'soups', name: 'Goat Pepper Soup', desc: 'Hot, peppery and fragrant. Good for the soul and the cold.', price: 5500, img: 'pepper-soup', orders: 480 },
      { id: 'small-chops', cat: 'grills', name: 'Small Chops Box', desc: 'Samosa, spring rolls, puff-puff and peppered gizzard.', price: 4000, img: 'small-chops', orders: 1020 },
      { id: 'peppered-chicken', cat: 'grills', name: 'Peppered Chicken', desc: 'Fried then tossed in scotch bonnet pepper sauce.', price: 4800, img: 'peppered-chicken', orders: 760, groups: [SPICE] },
      { id: 'grilled-beef', cat: 'grills', name: 'Grilled Beef & Pepper Sauce', desc: 'Flame-grilled beef slices with ata dindin on the side.', price: 5200, img: 'beans-dodo', orders: 330 },
      { id: 'smoothie', cat: 'drinks', name: 'Fresh Smoothie', desc: 'Mango, berry or green. Blended to order.', price: 3000, img: 'smoothies', orders: 870,
        groups: [{ id: 'flavour', name: 'Flavour', type: 'one', options: [
          { id: 'mango', label: 'Mango', price: 0 }, { id: 'berry', label: 'Berry', price: 0 }, { id: 'green', label: 'Green', price: 0 }] }] },
      { id: 'smoothie-duo', cat: 'drinks', name: 'Smoothie Duo', desc: 'Banana-oat and blueberry, one of each.', price: 5600, img: 'juice-trio', orders: 300 },
      { id: 'berry-jar', cat: 'drinks', name: 'Berry Blast Jar', desc: 'Mixed berries, yoghurt, a little honey.', price: 3300, img: 'smoothie-jar', orders: 260, soldOut: true }
    ]
  }
};

// Placeholder campuses. Replace with the confirmed pilot universities.
SN.CAMPUSES = [
  { id: 'northgate', name: 'Northgate University', hostels: ['Amber Hall', 'Cedar Hall', 'Jasper Hall', 'Onyx Hall'] },
  { id: 'lagoon', name: 'Lagoon City University', hostels: ['Harbour House', 'Marina Court', 'Tide Hall'] },
  { id: 'crestfield', name: 'Crestfield University', hostels: ['Crest A', 'Crest B', 'Summit Lodge', 'Valley Lodge'] }
];
SN.BLOCKS = ['A', 'B', 'C', 'D', 'E', 'F'];

// Demo order timing (seconds after payment) used by the sandbox tracker.
SN.STATUS_FLOW = [
  { id: 'paid', label: 'Paid', note: 'Payment confirmed', at: 0 },
  { id: 'accepted', label: 'Kitchen accepted', note: 'Your order is in the queue', at: 25 },
  { id: 'preparing', label: 'Preparing', note: 'Being cooked fresh', at: 90 },
  { id: 'out_for_delivery', label: 'Out for delivery', note: 'On the way to your hostel', at: 240 },
  { id: 'delivered', label: 'Delivered', note: 'Enjoy. Life Sweet.', at: 480 }
];
