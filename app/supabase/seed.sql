-- OverBerg Go — Seed Data
-- Run this after schema.sql to populate with initial data

-- ═══════════════════════════════════════════
-- RESTAURANTS
-- ═══════════════════════════════════════════
insert into public.restaurants (slug, name, emoji, bg_gradient, rating, review_count, delivery_time, delivery_fee, tag, subtitle, location, area) values
  ('harbour-cafe', 'Harbour Café', '🦐', 'linear-gradient(160deg,#0a1e2a,#061420)', 4.8, 312, '20 min', 35, 'Seafood', 'Seafood platter · Calamari · Hake · Harbour views', 'Struisbaai Harbour', 'Struisbaai'),
  ('michael-collins', 'Michael Collins Irish Pub', '🍺', 'linear-gradient(160deg,#1a0d05,#0d0800)', 4.5, 187, '25 min', 35, 'Irish Pub', 'Tapas · Burgers · Pizza · Beer garden', null, 'Struisbaai'),
  ('fish-and-more', 'Fish & More', '🐟', 'linear-gradient(160deg,#061e1a,#031510)', 4.7, 243, '15 min', 25, 'Takeaway', 'Yellowtail · Snoek · Hake · Fresh daily catch', '66 Main Road', 'Struisbaai'),
  ('gavins-trattoria', 'Gavin''s Trattoria Agulhas', '🍕', 'linear-gradient(160deg,#1a1005,#100a00)', 4.6, 156, '30 min', 38, 'Italian', 'Yellowtail · Fettuccine · Brisket pizza · Family run', 'L''Agulhas', 'L''Agulhas'),
  ('pret-restaurant', 'Pret Restaurant', '🍝', 'linear-gradient(160deg,#0f1a2a,#08111a)', 4.9, 98, '35 min', 40, 'Italian', 'Coastal Italian · Attentive service · L''Agulhas', null, 'L''Agulhas'),
  ('suidpunt', 'Suidpunt Potpourri', '☕', 'linear-gradient(160deg,#0a1a10,#060f0a)', 4.6, 134, '20 min', 28, 'Café', 'Coffee · Scones · Cakes · Gift shop · Southernmost café', '115 Main Rd', 'Struisbaai'),
  ('zuidste-kaap', 'Zuidste Kaap Restaurant', '🇿🇦', 'linear-gradient(160deg,#101a08,#0a1205)', 4.4, 89, '28 min', 32, 'SA Cuisine', 'Traditional SA breakfast · Lunch · Family dining', '99 Main Rd', 'L''Agulhas'),
  ('the-shed', 'The Shed', '🎵', 'linear-gradient(160deg,#1a0520,#0d031a)', 4.3, 67, '20 min', 30, 'Bar & Events', '', 'Struisbaai', 'Struisbaai'),
  ('thirstys', 'Thirsty''s Pub', '🍟', 'linear-gradient(160deg,#1a1005,#0f0800)', 4.2, 112, '22 min', 30, 'Grill & Pub', 'Pool tables · Fresh pub food · Cold beer · Local favourite', null, 'Struisbaai');

-- Set The Shed as closed
update public.restaurants set is_open = false, opens_at = '17:00' where slug = 'the-shed';

-- ═══════════════════════════════════════════
-- MENU ITEMS (Harbour Café)
-- ═══════════════════════════════════════════
insert into public.menu_items (restaurant_id, name, description, price, emoji, category, sort_order)
select r.id, v.name, v.description, v.price, v.emoji, v.category, v.sort_order
from public.restaurants r,
(values
  ('Calamari Rings', 'Lightly battered, with tartare sauce.', 89, '🍤', 'Starters', 1),
  ('Prawn Cocktail', 'Tiger prawns, lettuce, Marie Rose sauce', 110, '🥗', 'Starters', 2),
  ('Calamari Tubes', 'Grilled or fried, lemon butter', 95, '🦑', 'Starters', 3),
  ('Crayfish Bisque', 'West Coast rock lobster soup, cream, brandy', 78, '🍜', 'Starters', 4),
  ('Harbour Mezze', 'Sharing platter — calamari, fish bites, chips, dips', 145, '🥩', 'Starters', 5),
  ('Grilled Yellowtail', 'Fresh line fish, lemon butter, seasonal veg', 165, '🐟', 'Mains', 6),
  ('Fish & Chips', 'Beer-battered hake, hand-cut chips, tartare', 115, '🍟', 'Mains', 7),
  ('Seafood Platter for 2', 'Prawns, calamari, fish, mussels, rice, chips', 380, '🦐', 'Seafood', 8),
  ('Garlic Bread', 'Oven-baked with herb butter', 35, '🍞', 'Sides', 9),
  ('Castle Lager', '330ml ice cold', 32, '🍺', 'Drinks', 10),
  ('Malva Pudding', 'With custard and vanilla ice cream', 55, '🍮', 'Desserts', 11)
) as v(name, description, price, emoji, category, sort_order)
where r.slug = 'harbour-cafe';

-- MENU ITEMS (Michael Collins)
insert into public.menu_items (restaurant_id, name, description, price, emoji, category, sort_order)
select r.id, v.name, v.description, v.price, v.emoji, v.category, v.sort_order
from public.restaurants r,
(values
  ('Loaded Nachos', 'Cheese, jalapeños, guac, sour cream', 85, '🌮', 'Starters', 1),
  ('Classic Burger', '200g patty, cheddar, bacon, hand-cut chips', 120, '🍔', 'Mains', 2),
  ('Margherita Pizza', 'Tomato, mozzarella, fresh basil', 95, '🍕', 'Mains', 3),
  ('Guinness Draught', '440ml pint', 65, '🍺', 'Drinks', 4)
) as v(name, description, price, emoji, category, sort_order)
where r.slug = 'michael-collins';

-- MENU ITEMS (Fish & More)
insert into public.menu_items (restaurant_id, name, description, price, emoji, category, sort_order)
select r.id, v.name, v.description, v.price, v.emoji, v.category, v.sort_order
from public.restaurants r,
(values
  ('Yellowtail Fillet', 'Fresh daily catch, chips, salad', 130, '🐟', 'Mains', 1),
  ('Snoek & Chips', 'Local smoked snoek, hand-cut chips', 95, '🐠', 'Mains', 2),
  ('Hake & Chips', 'Beer-battered hake, tartare sauce', 85, '🍟', 'Mains', 3)
) as v(name, description, price, emoji, category, sort_order)
where r.slug = 'fish-and-more';

-- MENU ITEMS (Gavin's Trattoria)
insert into public.menu_items (restaurant_id, name, description, price, emoji, category, sort_order)
select r.id, v.name, v.description, v.price, v.emoji, v.category, v.sort_order
from public.restaurants r,
(values
  ('Yellowtail Carpaccio', 'Fresh yellowtail, capers, olive oil, lemon', 115, '🐟', 'Starters', 1),
  ('Fettuccine Alfredo', 'Cream, parmesan, mushrooms', 125, '🍝', 'Mains', 2),
  ('Brisket Pizza', '12-hour smoked brisket, mozzarella, BBQ glaze', 140, '🍕', 'Mains', 3)
) as v(name, description, price, emoji, category, sort_order)
where r.slug = 'gavins-trattoria';

-- ═══════════════════════════════════════════
-- EXPERIENCES
-- ═══════════════════════════════════════════
insert into public.experiences (name, description, emoji, bg_gradient, badge, duration, price, button_text, section, section_color, section_emoji) values
  ('Southern Tip Sea Adventures', 'Boat trips from Struisbaai Harbour — whale watching, seal colonies, sunsets, birding tours. PADI dive centre on-site.', '⛵', 'linear-gradient(160deg,#061e2e,#04131f)', '★ 4.9 · Sold out weekends', '2–4 hrs · from', 'R380/pax', 'Book Now', 'On the Water', 'text-sea', '⛵'),
  ('Awesome Charters — Saltwater Fishing', 'Deep sea & surf fishing at the southernmost tip of Africa. Yellowtail, snoek, tuna. All tackle provided.', '🎣', 'linear-gradient(160deg,#041520,#020d17)', '★ 4.8', 'Half or full day', 'R650/pax', 'Book Now', 'On the Water', 'text-sea', '⛵'),
  ('Dive Struisbaai — Scuba & Snorkelling', 'PADI dive courses, snorkelling experiences, and underwater guided tours. Warm Indian Ocean, visibility up to 12m.', '🤿', 'linear-gradient(160deg,#071a28,#041018)', '★ 4.7 · PADI Certified', '3 hrs · from', 'R420/pax', 'Book Now', 'On the Water', 'text-sea', '⛵'),
  ('Swim with Stingrays at the Harbour', 'Struisbaai''s famous harbour stingrays — Parrie and friends are gentle and habituated to people. Feed them by hand.', '🐠', 'linear-gradient(160deg,#041e2a,#021218)', 'Free · Daily', '30 min · Daily 9–11am', 'Free entry', 'Remind me', 'On the Water', 'text-sea', '⛵'),
  ('Robbie''s Surf School', 'Learn to surf on Struisbaai''s gentle Indian Ocean wave. Perfect for beginners. Board & wetsuit included.', '🏄', 'linear-gradient(160deg,#0a1a2a,#061018)', '★ 4.6 · Beginner friendly', '2 hrs · from', 'R350/pax', 'Book Now', 'On the Water', 'text-sea', '⛵'),
  ('Beach Dog Walker — Struisbaai', 'Daily morning & afternoon walks along South Africa''s longest beach. GPS tracked. Fully insured. Pickup & drop off.', '🐕', 'linear-gradient(160deg,#1a1005,#100800)', '★ 4.9 · Top Rated', '1 hr · from', 'R120/walk', 'Book Now', 'Pet Services', 'text-sun', '🐕'),
  ('Pet Sitting & House Minding', 'Trusted local sitters for cats, dogs, and small animals. Overnight stays available. Background checked.', '😺', 'linear-gradient(160deg,#1a0d05,#0f0800)', '★ 4.8', 'Per night · from', 'R200/night', 'Book Now', 'Pet Services', 'text-sun', '🐕'),
  ('E-Bike & Bicycle Hire', 'Explore the Agulhas Plain and coastal trails on quality bikes. Route maps included. Struisbaai to Arniston trail available.', '🚴', 'linear-gradient(160deg,#0a1a08,#061005)', '★ 4.8 · Popular', 'Half/full day', 'R150/day', 'Book Now', 'Explore the Overberg', 'text-primary', '🚴'),
  ('Agulhas National Park Hiking', 'Shipwreck trail, Rasperpunt hike & lighthouse trail inside the national park. Guided options available.', '🥾', 'linear-gradient(160deg,#0d1a06,#081005)', 'Free · Self-guided', '2–5 hrs · from', 'R80 entry', 'Book Guide', 'Explore the Overberg', 'text-primary', '🚴'),
  ('Horse Riding Along the Beach', 'Sunrise & sunset rides on Struisbaai''s white sand beach. All levels welcome. SA''s longest natural beach.', '🐴', 'linear-gradient(160deg,#1a0a05,#0f0500)', '★ 4.7', '1.5 hrs · from', 'R280/pax', 'Book Now', 'Explore the Overberg', 'text-primary', '🚴'),
  ('Cape Agulhas Lighthouse Museum', 'Africa''s only lighthouse museum. Climb to the top for ocean views. Operating since 1848, second-oldest in SA.', '💡', 'linear-gradient(160deg,#1a1505,#0f0e05)', '★ 4.9 · Heritage Site', '45 min', 'R60 entry', 'Buy Tickets', 'Culture & History', 'text-sea', '🏛️'),
  ('Shipwreck Museum — Bredasdorp', '150 ships wrecked along this coastline. Extraordinary collection of artifacts from maritime disasters spanning centuries.', '🚢', 'linear-gradient(160deg,#1a0a14,#0f0510)', '★ 4.7', '1–2 hrs', 'R50 entry', 'Buy Tickets', 'Culture & History', 'text-sea', '🏛️'),
  ('Cape Agulhas Wine Route Tour', 'Cool-climate Elim wines. Unique terroir exciting winemakers worldwide. Guided tastings, cellar tours, picnics. Private transfer included.', '🍷', 'linear-gradient(160deg,#1a0520,#0d0318)', '★ 4.8 · Award-winning', 'Half day · from', 'R450/pax', 'Book Now', 'Agulhas Wine Route', 'text-coral', '🍷');

-- ═══════════════════════════════════════════
-- STAYS
-- ═══════════════════════════════════════════
insert into public.stays (name, description, emoji, bg_gradient, location, area, rating, tag, meta, price) values
  ('Chateau de Marine Boutique Hotel', '9 luxury sea-facing rooms, private pool, 50m from beach. Voted best boutique stay in the Overberg.', '🌊', 'linear-gradient(160deg,#0a1e2a,#061420)', 'Struisbaai', 'Struisbaai', 4.9, 'Boutique', '🛏️ 9 rooms · 🏖️ Sea view', 'R2,800/night'),
  ('Agulhas Country Lodge', 'Built from local limestone, blends into a hill overlooking both oceans. All rooms with sea views. Breakfast included.', '🌿', 'linear-gradient(160deg,#061a10,#04120a)', 'L''Agulhas', 'L''Agulhas', 4.8, 'B&B', '🛏️ B&B · 🌅 Ocean view', 'R1,800/night'),
  ('The Arniston Hotel', 'Historic hotel in a national monument village. Steps from Kassiesbaai. Pool, restaurant, private beach access.', '⛵', 'linear-gradient(160deg,#1a1008,#100a05)', 'Arniston', 'Arniston', 4.9, 'Boutique', '🛏️ 12 rooms · 🍽️ Restaurant', 'R2,200/night'),
  ('Casa Pescador Self-Catering', 'The Fisherman''s House — 2 min walk to beach. Fully equipped kitchen, braai area, private garden. 6-sleeper.', '🏡', 'linear-gradient(160deg,#0a1a12,#061210)', 'Struisbaai', 'Struisbaai', 4.7, 'Self-Catering', '🛏️ 6 sleeper · 🔥 Braai', 'R1,400/night'),
  ('House of 2 Oceans', 'Where the Atlantic meets the Indian. Private balcony overlooking the southern tip of Africa. Self-catering.', '🌾', 'linear-gradient(160deg,#1a1a06,#10100a)', 'L''Agulhas', 'L''Agulhas', 4.8, 'Self-Catering', '🛏️ 2 bed · 🌊 2 oceans', 'R1,600/night'),
  ('Struisbaai Caravan Park', 'Direct beach access. Powered sites, fully equipped ablutions, braai facilities. Book months ahead for school holidays.', '🏕️', 'linear-gradient(160deg,#0a1510,#06100c)', 'Struisbaai', 'Struisbaai', 4.6, 'Camping', '🏕️ 60 sites · 🏖️ Beach', 'R280/night');
