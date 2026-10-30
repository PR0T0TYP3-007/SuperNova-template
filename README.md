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

## Photos

Most photos are from [Unsplash](https://unsplash.com). The market photos are from Wikimedia Commons:

- Ariaria Market, Aba: by Nyerougo, [CC0](https://commons.wikimedia.org/wiki/File:Ariaria_International_Market.webp)
- Umuahia Market: cropped from "Umuahia montage" by Ukabia, [CC BY-SA 3.0](https://commons.wikimedia.org/wiki/File:Umuahia_montage.jpg). The cropped image (`assets/img/market-umuahia.webp`) is shared under the same licence.
- Tomato basket: "The Beauty of Fresh Tomatoes in Nigeria" by Frankincense Diala, [CC BY-SA 4.0](https://commons.wikimedia.org/wiki/File:The_Beauty_of_Fresh_Tomatoes_in_Nigeria.jpg)
