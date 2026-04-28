export interface Restaurant {
  id: string;
  name: string;
  emoji: string;
  bg: string;
  rating: string;
  reviews: number;
  time: string;
  deliveryFee: string;
  tag: string;
  subtitle: string;
  location?: string;
  closed?: boolean;
  closedTime?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  emoji: string;
  category: string;
}

export interface Experience {
  id: string;
  name: string;
  description: string;
  emoji: string;
  bg: string;
  badge: string;
  duration: string;
  price: string;
  buttonText: string;
  section: string;
  sectionColor: string;
  sectionEmoji: string;
}

export interface Stay {
  id: string;
  name: string;
  description: string;
  emoji: string;
  bg: string;
  location: string;
  rating: string;
  meta: string;
  price: string;
  tag: string;
}

export const restaurants: Restaurant[] = [
  { id: "harbour-cafe", name: "Harbour Café", emoji: "🦐", bg: "linear-gradient(160deg,#e4f5fa,#d4eef6)", rating: "4.8", reviews: 312, time: "20 min", deliveryFee: "R35", tag: "Seafood", subtitle: "Seafood platter · Calamari · Hake · Harbour views", location: "Struisbaai Harbour" },
  { id: "michael-collins", name: "Michael Collins Irish Pub", emoji: "🍺", bg: "linear-gradient(160deg,#f5efe4,#ede5d4)", rating: "4.5", reviews: 187, time: "25 min", deliveryFee: "R35", tag: "Irish Pub", subtitle: "Tapas · Burgers · Pizza · Beer garden" },
  { id: "fish-and-more", name: "Fish & More", emoji: "🐟", bg: "linear-gradient(160deg,#e4f5f0,#d6f0e8)", rating: "4.7", reviews: 243, time: "15 min", deliveryFee: "R25", tag: "Takeaway", subtitle: "Yellowtail · Snoek · Hake · Fresh daily catch", location: "66 Main Road" },
  { id: "gavins-trattoria", name: "Gavin's Trattoria Agulhas", emoji: "🍕", bg: "linear-gradient(160deg,#fef5e3,#f8edd4)", rating: "4.6", reviews: 156, time: "30 min", deliveryFee: "R38", tag: "Italian", subtitle: "Yellowtail · Fettuccine · Brisket pizza · Family run", location: "L'Agulhas" },
  { id: "pret-restaurant", name: "Pret Restaurant", emoji: "🍝", bg: "linear-gradient(160deg,#eef2fa,#e4e9f5)", rating: "4.9", reviews: 98, time: "35 min", deliveryFee: "R40", tag: "Italian", subtitle: "Coastal Italian · Attentive service · L'Agulhas" },
  { id: "suidpunt", name: "Suidpunt Potpourri", emoji: "☕", bg: "linear-gradient(160deg,#e8f7ef,#dcf0e3)", rating: "4.6", reviews: 134, time: "20 min", deliveryFee: "R28", tag: "Café", subtitle: "Coffee · Scones · Cakes · Gift shop · Southernmost café", location: "115 Main Rd" },
  { id: "zuidste-kaap", name: "Zuidste Kaap Restaurant", emoji: "🇿🇦", bg: "linear-gradient(160deg,#edf7e8,#e0f0d8)", rating: "4.4", reviews: 89, time: "28 min", deliveryFee: "R32", tag: "SA Cuisine", subtitle: "Traditional SA breakfast · Lunch · Family dining", location: "99 Main Rd" },
  { id: "the-shed", name: "The Shed", emoji: "🎵", bg: "linear-gradient(160deg,#f3e8f8,#ecddf5)", rating: "4.3", reviews: 67, time: "20 min", deliveryFee: "R30", tag: "Bar & Events", subtitle: "", location: "Struisbaai", closed: true, closedTime: "Opens 17:00" },
  { id: "thirstys", name: "Thirsty's Pub", emoji: "🍟", bg: "linear-gradient(160deg,#f5efe4,#ede5d4)", rating: "4.2", reviews: 112, time: "22 min", deliveryFee: "R30", tag: "Grill & Pub", subtitle: "Pool tables · Fresh pub food · Cold beer · Local favourite" },
];

export const menusByRestaurant: Record<string, MenuItem[]> = {
  "harbour-cafe": [
    { id: "hc-1", name: "Calamari Rings", description: "Lightly battered, with tartare sauce.", price: 89, emoji: "🍤", category: "Starters" },
    { id: "hc-2", name: "Prawn Cocktail", description: "Tiger prawns, lettuce, Marie Rose sauce", price: 110, emoji: "🥗", category: "Starters" },
    { id: "hc-3", name: "Calamari Tubes", description: "Grilled or fried, lemon butter", price: 95, emoji: "🦑", category: "Starters" },
    { id: "hc-4", name: "Crayfish Bisque", description: "West Coast rock lobster soup, cream, brandy", price: 78, emoji: "🍜", category: "Starters" },
    { id: "hc-5", name: "Harbour Mezze", description: "Sharing platter — calamari, fish bites, chips, dips", price: 145, emoji: "🥩", category: "Starters" },
    { id: "hc-6", name: "Grilled Yellowtail", description: "Fresh line fish, lemon butter, seasonal veg", price: 165, emoji: "🐟", category: "Mains" },
    { id: "hc-7", name: "Seafood Platter for 2", description: "Prawns, calamari, fish, mussels, rice, chips", price: 380, emoji: "🦐", category: "Seafood" },
    { id: "hc-8", name: "Fish & Chips", description: "Beer-battered hake, hand-cut chips, tartare", price: 115, emoji: "🍟", category: "Mains" },
    { id: "hc-9", name: "Garlic Bread", description: "Oven-baked with herb butter", price: 35, emoji: "🍞", category: "Sides" },
    { id: "hc-10", name: "Castle Lager", description: "330ml ice cold", price: 32, emoji: "🍺", category: "Drinks" },
    { id: "hc-11", name: "Malva Pudding", description: "With custard and vanilla ice cream", price: 55, emoji: "🍮", category: "Desserts" },
  ],
  "michael-collins": [
    { id: "mc-1", name: "Loaded Nachos", description: "Cheese, jalapeños, guac, sour cream", price: 85, emoji: "🌮", category: "Starters" },
    { id: "mc-2", name: "Classic Burger", description: "200g patty, cheddar, bacon, hand-cut chips", price: 120, emoji: "🍔", category: "Mains" },
    { id: "mc-3", name: "Margherita Pizza", description: "Tomato, mozzarella, fresh basil", price: 95, emoji: "🍕", category: "Mains" },
    { id: "mc-4", name: "Guinness Draught", description: "440ml pint", price: 65, emoji: "🍺", category: "Drinks" },
  ],
  "fish-and-more": [
    { id: "fm-1", name: "Yellowtail Fillet", description: "Fresh daily catch, chips, salad", price: 130, emoji: "🐟", category: "Mains" },
    { id: "fm-2", name: "Snoek & Chips", description: "Local smoked snoek, hand-cut chips", price: 95, emoji: "🐠", category: "Mains" },
    { id: "fm-3", name: "Hake & Chips", description: "Beer-battered hake, tartare sauce", price: 85, emoji: "🍟", category: "Mains" },
  ],
  "gavins-trattoria": [
    { id: "gt-1", name: "Yellowtail Carpaccio", description: "Fresh yellowtail, capers, olive oil, lemon", price: 115, emoji: "🐟", category: "Starters" },
    { id: "gt-2", name: "Fettuccine Alfredo", description: "Cream, parmesan, mushrooms", price: 125, emoji: "🍝", category: "Mains" },
    { id: "gt-3", name: "Brisket Pizza", description: "12-hour smoked brisket, mozzarella, BBQ glaze", price: 140, emoji: "🍕", category: "Mains" },
  ],
};

export const experiences: Experience[] = [
  { id: "sea-adventures", name: "Southern Tip Sea Adventures", description: "Boat trips from Struisbaai Harbour — whale watching, seal colonies, sunsets, birding tours. PADI dive centre on-site.", emoji: "⛵", bg: "linear-gradient(160deg,#e4f5fa,#d0ecf5)", badge: "★ 4.9 · Sold out weekends", duration: "2–4 hrs · from", price: "R380/pax", buttonText: "Book Now", section: "On the Water", sectionColor: "text-sea", sectionEmoji: "⛵" },
  { id: "fishing-charters", name: "Awesome Charters — Saltwater Fishing", description: "Deep sea & surf fishing at the southernmost tip of Africa. Yellowtail, snoek, tuna. All tackle provided.", emoji: "🎣", bg: "linear-gradient(160deg,#dceef8,#cfe6f2)", badge: "★ 4.8", duration: "Half or full day", price: "R650/pax", buttonText: "Book Now", section: "On the Water", sectionColor: "text-sea", sectionEmoji: "⛵" },
  { id: "dive-struisbaai", name: "Dive Struisbaai — Scuba & Snorkelling", description: "PADI dive courses, snorkelling experiences, and underwater guided tours. Warm Indian Ocean, visibility up to 12m.", emoji: "🤿", bg: "linear-gradient(160deg,#e0f2fa,#d2ebf5)", badge: "★ 4.7 · PADI Certified", duration: "3 hrs · from", price: "R420/pax", buttonText: "Book Now", section: "On the Water", sectionColor: "text-sea", sectionEmoji: "⛵" },
  { id: "stingrays", name: "Swim with Stingrays at the Harbour", description: "Struisbaai's famous harbour stingrays — Parrie and friends are gentle and habituated to people. Feed them by hand.", emoji: "🐠", bg: "linear-gradient(160deg,#e8f7ef,#dcf0e6)", badge: "Free · Daily", duration: "30 min · Daily 9–11am", price: "Free entry", buttonText: "Remind me", section: "On the Water", sectionColor: "text-sea", sectionEmoji: "⛵" },
  { id: "surf-school", name: "Robbie's Surf School", description: "Learn to surf on Struisbaai's gentle Indian Ocean wave. Perfect for beginners. Board & wetsuit included.", emoji: "🏄", bg: "linear-gradient(160deg,#e4f0fa,#d6e8f5)", badge: "★ 4.6 · Beginner friendly", duration: "2 hrs · from", price: "R350/pax", buttonText: "Book Now", section: "On the Water", sectionColor: "text-sea", sectionEmoji: "⛵" },
  { id: "dog-walker", name: "Beach Dog Walker — Struisbaai", description: "Daily morning & afternoon walks along South Africa's longest beach. GPS tracked. Fully insured. Pickup & drop off.", emoji: "🐕", bg: "linear-gradient(160deg,#fef5e3,#fcedd0)", badge: "★ 4.9 · Top Rated", duration: "1 hr · from", price: "R120/walk", buttonText: "Book Now", section: "Pet Services", sectionColor: "text-sun", sectionEmoji: "🐕" },
  { id: "pet-sitting", name: "Pet Sitting & House Minding", description: "Trusted local sitters for cats, dogs, and small animals. Overnight stays available. Background checked.", emoji: "😺", bg: "linear-gradient(160deg,#f5efe4,#ede5d4)", badge: "★ 4.8", duration: "Per night · from", price: "R200/night", buttonText: "Book Now", section: "Pet Services", sectionColor: "text-sun", sectionEmoji: "🐕" },
  { id: "ebike", name: "E-Bike & Bicycle Hire", description: "Explore the Agulhas Plain and coastal trails on quality bikes. Route maps included. Struisbaai to Arniston trail available.", emoji: "🚴", bg: "linear-gradient(160deg,#e8f7ef,#dcf0e3)", badge: "★ 4.8 · Popular", duration: "Half/full day", price: "R150/day", buttonText: "Book Now", section: "Explore the Overberg", sectionColor: "text-primary", sectionEmoji: "🚴" },
  { id: "hiking", name: "Agulhas National Park Hiking", description: "Shipwreck trail, Rasperpunt hike & lighthouse trail inside the national park. Guided options available. Fynbos, birds, coastal views.", emoji: "🥾", bg: "linear-gradient(160deg,#edf7e8,#e0f0d8)", badge: "Free · Self-guided", duration: "2–5 hrs · from", price: "R80 entry", buttonText: "Book Guide", section: "Explore the Overberg", sectionColor: "text-primary", sectionEmoji: "🚴" },
  { id: "horse-riding", name: "Horse Riding Along the Beach", description: "Sunrise & sunset rides on Struisbaai's white sand beach. All levels welcome. SA's longest natural beach.", emoji: "🐴", bg: "linear-gradient(160deg,#fef0e8,#fce6d8)", badge: "★ 4.7", duration: "1.5 hrs · from", price: "R280/pax", buttonText: "Book Now", section: "Explore the Overberg", sectionColor: "text-primary", sectionEmoji: "🚴" },
  { id: "lighthouse", name: "Cape Agulhas Lighthouse Museum", description: "Africa's only lighthouse museum. Climb to the top for ocean views. Operating since 1848, second-oldest in SA.", emoji: "💡", bg: "linear-gradient(160deg,#fef8e3,#faf2d4)", badge: "★ 4.9 · Heritage Site", duration: "45 min", price: "R60 entry", buttonText: "Buy Tickets", section: "Culture & History", sectionColor: "text-sea", sectionEmoji: "🏛️" },
  { id: "shipwreck-museum", name: "Shipwreck Museum — Bredasdorp", description: "150 ships wrecked along this coastline. Extraordinary collection of artifacts from maritime disasters spanning centuries.", emoji: "🚢", bg: "linear-gradient(160deg,#f3e8f2,#edddf0)", badge: "★ 4.7", duration: "1–2 hrs", price: "R50 entry", buttonText: "Buy Tickets", section: "Culture & History", sectionColor: "text-sea", sectionEmoji: "🏛️" },
  { id: "wine-route", name: "Cape Agulhas Wine Route Tour", description: "Cool-climate Elim wines. Unique terroir exciting winemakers worldwide. Guided tastings, cellar tours, picnics. Private transfer included.", emoji: "🍷", bg: "linear-gradient(160deg,#f8e8f0,#f2dce8)", badge: "★ 4.8 · Award-winning", duration: "Half day · from", price: "R450/pax", buttonText: "Book Now", section: "Agulhas Wine Route", sectionColor: "text-coral", sectionEmoji: "🍷" },
];

export const stays: Stay[] = [
  { id: "chateau-marine", name: "Chateau de Marine Boutique Hotel", description: "9 luxury sea-facing rooms, private pool, 50m from beach. Voted best boutique stay in the Overberg.", emoji: "🌊", bg: "linear-gradient(160deg,#e4f5fa,#d4eef6)", location: "Struisbaai", rating: "4.9", meta: "🛏️ 9 rooms · 🏖️ Sea view", price: "R2,800/night", tag: "Boutique" },
  { id: "agulhas-lodge", name: "Agulhas Country Lodge", description: "Built from local limestone, blends into a hill overlooking both oceans. All rooms with sea views. Breakfast included.", emoji: "🌿", bg: "linear-gradient(160deg,#e8f7ef,#dcf0e3)", location: "L'Agulhas", rating: "4.8", meta: "🛏️ B&B · 🌅 Ocean view", price: "R1,800/night", tag: "B&B" },
  { id: "arniston-hotel", name: "The Arniston Hotel", description: "Historic hotel in a national monument village. Steps from Kassiesbaai. Pool, restaurant, private beach access.", emoji: "⛵", bg: "linear-gradient(160deg,#f5efe4,#ede5d4)", location: "Arniston", rating: "4.9", meta: "🛏️ 12 rooms · 🍽️ Restaurant", price: "R2,200/night", tag: "Boutique" },
  { id: "casa-pescador", name: "Casa Pescador Self-Catering", description: "The Fisherman's House — 2 min walk to beach. Fully equipped kitchen, braai area, private garden. 6-sleeper.", emoji: "🏡", bg: "linear-gradient(160deg,#e8f7ef,#dcf0e8)", location: "Struisbaai", rating: "4.7", meta: "🛏️ 6 sleeper · 🔥 Braai", price: "R1,400/night", tag: "Self-Catering" },
  { id: "house-2-oceans", name: "House of 2 Oceans", description: "Where the Atlantic meets the Indian. Private balcony overlooking the southern tip of Africa. Self-catering.", emoji: "🌾", bg: "linear-gradient(160deg,#fef8e3,#faf2d4)", location: "L'Agulhas", rating: "4.8", meta: "🛏️ 2 bed · 🌊 2 oceans", price: "R1,600/night", tag: "Self-Catering" },
  { id: "caravan-park", name: "Struisbaai Caravan Park", description: "Direct beach access. Powered sites, fully equipped ablutions, braai facilities. Book months ahead for school holidays.", emoji: "🏕️", bg: "linear-gradient(160deg,#edf7e8,#e0f0d8)", location: "Struisbaai", rating: "4.6", meta: "🏕️ 60 sites · 🏖️ Beach", price: "R280/night", tag: "Camping" },
];

export const groceryCategories = [
  { emoji: "🥦", name: "Produce" },
  { emoji: "🥩", name: "Meat" },
  { emoji: "🥛", name: "Dairy" },
  { emoji: "🍞", name: "Bakery" },
  { emoji: "🧴", name: "Health" },
  { emoji: "🍷", name: "Liquor" },
  { emoji: "🧊", name: "Frozen" },
  { emoji: "🐾", name: "Pets" },
];

export const groceryProducts = [
  { id: "pnp-1", name: "Beef Braai Pack 1kg", emoji: "🥩", price: "R89.99", discount: "-30%" },
  { id: "pnp-2", name: "Cheddar 400g", emoji: "🧀", price: "R39.99", discount: "-20%" },
  { id: "pnp-3", name: "Free Range Eggs 6pk", emoji: "🥚", price: "R32.99" },
  { id: "pnp-4", name: "Pink Lady Apples 1kg", emoji: "🍎", price: "R29.99" },
  { id: "pnp-5", name: "Yellowtail Fillet 400g", emoji: "🐟", price: "R74.99", discount: "-15%" },
  { id: "pnp-6", name: "White Bread 700g", emoji: "🥖", price: "R18.99" },
  { id: "pnp-7", name: "Broccoli Head", emoji: "🥦", price: "R19.99" },
  { id: "pnp-8", name: "Navel Oranges 1.5kg", emoji: "🍊", price: "R24.99", discount: "-25%" },
];
