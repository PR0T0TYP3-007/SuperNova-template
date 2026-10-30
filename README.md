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
| Orders | `orders.html` |
| Flights (coming soon) | `flights.html` |

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

Photos from [Unsplash](https://unsplash.com).
