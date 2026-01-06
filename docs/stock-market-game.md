# Stock Market Game & Bot Sandbox

A lightweight stock-market simulator with an HTML canvas price board and a programmable bot sandbox.

## How to get there
- Menu → **Stock Market Game** (`/market-sim`)

## Playing the game
- Price updates about once per second with gentle drift and noise.
- Manual actions: Buy/Sell quick buttons (5 or 20 shares), Pause/Resume, Reset.
- Dashboard shows cash, position, average cost, unrealized P&L, and total equity.

## Writing a bot
1. In the Automation panel, edit the code and click **Run Code**.
2. Define `run(state, api, utils)`; it is called every tick.
3. Use the provided helpers:
   - `state`: `{ price, cash, position, avgCost, tick, history }`
   - `api`: `buy(qty)`, `sell(qty)`, `log(message)`
   - `utils`: `trend` (short-term delta), `volatility` (`0-1` scale)
4. Example starter:
   ```js
   function run(state, api, utils) {
     const recentAvg = state.history.slice(-20).reduce((s, p) => s + p, 0) / Math.max(1, state.history.slice(-20).length);
     if (state.price < recentAvg * 0.99 && state.cash > state.price * 3) api.buy(3);
     if (state.price > recentAvg * 1.01 && state.position > 0) api.sell(Math.min(3, state.position));
   }
   ```

## Notes
- Bots run inside `new Function` with a minimal API (not a full sandbox); keep code lightweight.
- Logs show your bot and manual trade events for quick debugging.
- Reset clears portfolio, price history, and logs so you can iterate fast.
