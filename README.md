# Supernova — Life Sweet.

Front-end template for Supernova, the student platform by 3Projects: food from Crunchies and Roots delivered to hostels, with flights coming soon.

Plain HTML, CSS and JavaScript. No build step.

## Pages

| Page | File |
| --- | --- |
| Home | `index.html` |
| Food (choose a kitchen) | `food.html` |
| Kitchen menu | `kitchen.html?k=crunchies` / `kitchen.html?k=roots` |
| Bags (one per kitchen) | `cart.html` |
| Checkout | `checkout.html?k=…` |
| Order tracking | `order.html?id=…` |
| Market runs (foodstuff lists from Umuahia and Aba, quoted by partners) | `market.html` |
| Dry cleaning (pickup booking) | `laundry.html` |
| Orders | `orders.html` |
| Flights (coming soon) | `flights.html` |

Ordering food: pick Crunchies or Roots → pick an outlet → menu → bag → checkout step 1 (contact and delivery details) → step 2 (review and pay) → tracking.

## Admin

Open `admin/index.html` (not linked from the public site). Switch accounts in the top bar:

| Account | Role | Can see |
| --- | --- | --- |
| Augustus, Covenant Chukwudi | Admin | Everything |
| Crunchies Group | Viewer (read only) | Overview and the attribution report |

| Page | What it's for |
| --- | --- |
| Overview | Orders, sales, net after refunds, average food order, refund rate, delivery time and customers vs the previous period; what needs attention; live orders by step; sales by restaurant; busy hours; top items; outlet performance; busiest hostels |
| Orders | Every order with filters and a detail drawer: move an order to its next step, mark it done, cancel, refund |
| Requests | Price market runs and send the quote, build flight shortlists, count laundry at pickup and move it along |
| Issues & refunds | Resolve reported problems; refunds over the limit need a second admin (not the one who asked); payment disputes |
| Attribution report | Supernova food orders sent to Crunchies Group by day, restaurant and outlet, net of refunds, with CSV export |
| Outlets & menu | Open or close outlets, switch items off per outlet, popularity ranking |
| Audit log | Every admin action, who and when (append-only) |
| Settings | Sandbox autopilot, refund approval limit, fees, reset demo data |

Admin data is a deterministic 60-day sample history plus real orders placed in the same browser. Quotes, shortlists, status changes, refunds and outlet or menu switches made in admin show up on the student's pages. Turn **autopilot** off in Settings to drive every step by hand. In production, admin needs real sign-in with 2FA and its own subdomain, as the design document says.

## Run locally

```bash
python -m http.server 8137
```

Then open http://localhost:8137.

## Template status

- Menu items, prices, fees and campuses in `js/data.js` are placeholders.
- `js/store.js` keeps bags and orders in the browser and simulates payment and order status. Swap its functions for API calls when the backend is ready.
- Crunchies and Roots items never share a bag. Each kitchen has its own bag and checkout.
- After changing CSS or JS, bump the `?v=` number on the links in each HTML file so browsers fetch the new files.

## Add to home screen

The site is an installable web app (`manifest.webmanifest`, `sw.js`, icons in `assets/icons/`).

- Android / Chrome: a card offers "Add to home screen" and opens the browser's install dialog.
- iPhone / iPad: iOS has no install API, so the card shows the Share → Add to Home Screen steps.
- The card waits 4 seconds, never shows when already installed or on cart/checkout, and "Not now" hides it for 7 days.
- Preview it on any device with `?install=ios` or `?install=android` on the URL.
- The service worker caches only static files. Pages load network-first so updates show straight away; `offline.html` appears when there's no connection. Bump `VERSION` in `sw.js` if you ever need to wipe old caches.

## Photos

Most photos are from [Unsplash](https://unsplash.com). The market photos are from Wikimedia Commons:

- Ariaria Market, Aba: by Nyerougo, [CC0](https://commons.wikimedia.org/wiki/File:Ariaria_International_Market.webp)
- Umuahia Market: cropped from "Umuahia montage" by Ukabia, [CC BY-SA 3.0](https://commons.wikimedia.org/wiki/File:Umuahia_montage.jpg). The cropped image (`assets/img/market-umuahia.webp`) is shared under the same licence.
- Tomato basket: "The Beauty of Fresh Tomatoes in Nigeria" by Frankincense Diala, [CC BY-SA 4.0](https://commons.wikimedia.org/wiki/File:The_Beauty_of_Fresh_Tomatoes_in_Nigeria.jpg)
