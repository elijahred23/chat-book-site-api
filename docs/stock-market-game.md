# Stock Market Game & Bot Sandbox

A lightweight stock-market simulator with an HTML canvas price board and a programmable bot sandbox.

## How to get there
- Menu → **Stock Market Game** (`/market-sim`)

## Playing the game
- Pick one of 10 stocks from the selector; each has its own price history and portfolio.
- Price updates about once per second with gentle drift and noise.
- Manual actions: Pause/Resume the market, Reset (resets all stocks and portfolios).
- Dashboard shows cash, position, average cost, unrealized P&L, and total equity for the selected stock.

## Writing a bot
1. In the Automation panel, edit the code and click **Start Program**.
2. Define `run(market, api, utils)`; you control the loop and pacing. The market view selection does **not** affect your bot; pick its target in the Automation panel (“Bot target”).
3. Use the provided helpers:
   - `market`: `market.active()` (current stock snapshot), `market.stocks()` (all stocks), `market.pick(symbolOrIndex)` (one stock), plus quick getters `market.price`/`market.cash`/`market.position`.
   - `api`: `buy(qty, target)`, `sell(qty, target)`, `log(message)`, `sleep(ms)` (target is required: stock index or symbol)
   - `utils`: `trend` (short-term delta), `volatility` (`0-1` scale)
4. Control flow: use `while` + `await api.sleep(ms)` to tick and act.
5. Multi-stock access: use `market.stocks()[index]` to inspect other symbols (price, cash, position, avgCost, history). Trades apply to the currently selected stock in the UI.
6. Targeted trades: you must pass a target to choose the stock programmatically:
   ```js
   api.buy(1, 0);        // buy 1 share of the stock at index 0
   api.sell(2, "BETA");  // sell 2 shares of the stock with symbol "BETA"
   ```
6. You can use full JavaScript: objects, arrays, Maps/Sets, classes. Keep persistent bot memory in module-level variables or closures. Example:
   ```js
   const memory = new Map();
   class Trader {
     step(view, api) {
       const stats = memory.get(view.symbol) || { seen: 0 };
       stats.seen += 1;
       memory.set(view.symbol, stats);
       if (view.price < (view.history.at(-1) || view.price)) api.buy(1);
     }
   }
   const trader = new Trader();
   async function run(market, api) {
     while (true) {
       trader.step(market.active(), api);
       await api.sleep(900);
     }
   }
   ```
7. Sample recipes:
   ```js
   // Switch stocks by index
   async function run(market, api) {
     let idx = 0;
     while (true) {
       const stocks = market.stocks();
       const target = stocks[idx % stocks.length];
       if (target.price < target.history.at(-1)) api.buy(1, idx);
       idx++;
       await api.sleep(800);
     }
   }
   ```
   ```js
   // Momentum on selected stock
   async function run(market, api, utils) {
     while (true) {
       const view = market.active();
       if (utils.trend > 0 && view.cash > view.price) api.buy(1); // active stock
       if (utils.trend < 0 && view.position > 0) api.sell(1);
       await api.sleep(900);
     }
   }
   ```
   ```js
   // Hash map of caps and size adjustments
   const caps = new Map();
   caps.set("ALPHA", 5); caps.set("BETA", 2);
   async function run(market, api) {
     const limit = caps.get(market.active().symbol) || 1;
     while (true) {
       const view = market.active();
       if (view.position < limit && view.cash > view.price) api.buy(1, view.symbol);
       if (view.position > limit) api.sell(view.position - limit, view.symbol);
       await api.sleep(1000);
     }
   }
   ```
   ```js
   // Class-based risk manager
   class Risk {
     constructor(maxDraw = 0.05) { this.maxDraw = maxDraw; }
     shouldSell(view) {
       const peak = Math.max(...view.history.slice(-30));
       return view.price < peak * (1 - this.maxDraw) && view.position > 0;
     }
   }
   const risk = new Risk(0.03);
   async function run(market, api) {
     while (true) {
       const view = market.active();
       if (risk.shouldSell(view)) api.sell(view.position);
       await api.sleep(1200);
     }
   }
   ```

## Market API & utils reference
- `market.active()` → copy of the bot target stock: `{ symbol, name, price, cash, position, avgCost, history[], tick, targetIndex }`.
- `market.stocks()` → array of copies of all stocks with `{ symbol, name, price, cash, position, avgCost, history[] }`.
- `market.pick(symbolOrIndex)` → one stock copy or `null` if not found.
- Quick getters on `market`: `price`, `cash`, `position`, `avgCost`, `tick`, `history`, `symbol`, `name`, `targetIndex` mirror `market.active()`.
- `api.buy(qty, target)` / `api.sell(qty, target)` → place trades on a stock by index or symbol (required target).
- `api.log(message)` → append a bot log entry.
- `api.sleep(ms)` → promise that resolves after at least 400ms; use in loops.
- `utils.trend` → short-term price delta for the bot target (last vs 5 steps back).
- `utils.volatility` → 0–1 scale of recent price noise for the bot target.

## Notes
- Bots run inside `new Function` with a minimal API (not a full sandbox); keep code lightweight.
- Logs show your bot and manual trade events for quick debugging.
- Reset clears portfolio, price history, and logs so you can iterate fast.
