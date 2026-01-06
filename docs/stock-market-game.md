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
2. Define `run(state, api, utils)`; you control the loop and pacing.
3. Use the provided helpers:
   - `state`: `{ price, cash, position, avgCost, tick, history, stocks[] }` (the active stock and an array of all stocks)
   - `api`: `buy(qty, target)`, `sell(qty, target)`, `log(message)`, `sleep(ms)` (target is required: stock index or symbol)
   - `utils`: `trend` (short-term delta), `volatility` (`0-1` scale)
4. Control flow: use `while` + `await api.sleep(ms)` to tick and act.
5. Multi-stock access: use `state.stocks[index]` to inspect other symbols (price, cash, position, avgCost, history). Trades apply to the currently selected stock in the UI.
6. Targeted trades: you must pass a target to choose the stock programmatically:
   ```js
   api.buy(1, 0);        // buy 1 share of the stock at index 0
   api.sell(2, "BETA");  // sell 2 shares of the stock with symbol "BETA"
   ```
6. You can use full JavaScript: objects, arrays, Maps/Sets, classes. Keep persistent bot memory in module-level variables or closures. Example:
   ```js
   const memory = new Map();
   class Trader {
     step(state, api) {
       const stats = memory.get(state.symbol) || { seen: 0 };
       stats.seen += 1;
       memory.set(state.symbol, stats);
       if (state.price < (state.history.at(-1) || state.price)) api.buy(1);
     }
   }
   const trader = new Trader();
   async function run(state, api) {
     while (true) {
       trader.step(state, api);
       await api.sleep(900);
     }
   }
   ```
7. Sample recipes:
   ```js
   // Switch stocks by index
   async function run(state, api) {
     let idx = 0;
     while (true) {
       const target = state.stocks[idx % state.stocks.length];
       if (target.price < target.history.at(-1)) api.buy(1, idx);
       idx++;
       await api.sleep(800);
     }
   }
   ```
   ```js
   // Momentum on selected stock
   async function run(state, api, utils) {
     while (true) {
       if (utils.trend > 0 && state.cash > state.price) api.buy(1); // active stock
       if (utils.trend < 0 && state.position > 0) api.sell(1);
       await api.sleep(900);
     }
   }
   ```
   ```js
   // Hash map of caps and size adjustments
   const caps = new Map();
   caps.set("ALPHA", 5); caps.set("BETA", 2);
   async function run(state, api) {
     const limit = caps.get(state.symbol) || 1;
     while (true) {
       if (state.position < limit && state.cash > state.price) api.buy(1, state.symbol);
       if (state.position > limit) api.sell(state.position - limit, state.symbol);
       await api.sleep(1000);
     }
   }
   ```
   ```js
   // Class-based risk manager
   class Risk {
     constructor(maxDraw = 0.05) { this.maxDraw = maxDraw; }
     shouldSell(state) {
       const peak = Math.max(...state.history.slice(-30));
       return state.price < peak * (1 - this.maxDraw) && state.position > 0;
     }
   }
   const risk = new Risk(0.03);
   async function run(state, api) {
     while (true) {
       if (risk.shouldSell(state)) api.sell(state.position);
       await api.sleep(1200);
     }
   }
   ```

## Notes
- Bots run inside `new Function` with a minimal API (not a full sandbox); keep code lightweight.
- Logs show your bot and manual trade events for quick debugging.
- Reset clears portfolio, price history, and logs so you can iterate fast.
