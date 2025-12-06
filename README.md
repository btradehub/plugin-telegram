# Telegram Control & Notifications for Trading Strategies

This plugin enables **Telegram messaging** from your trading strategy.

Use it for:
- Trade execution alerts
- Status or performance updates
- Manual strategy control via Telegram commands
- Interaction during live trading

> ⚠️ Telegram messaging is **only active in live modes**  
> (ignored in backtests to avoid spam)

---

## 🏁 Summary

| Feature                      |        Status        |
| ---------------------------- | :------------------: |
| Send Message                 |          ✔️          |
| Telegram bot command support |          ✔️          |
| Basic text message handling  |          ✔️          |
| Auto `/help` command         |          ✔️          |
| Restrict user access         |          ✔️          |
| Notifications in backtest    | ❌ Disabled by design |
---

## 🚀 Setup

Enable the plugin inside your strategy:

```js
const myChatId = 1033333337;

trader.require("telegram", {
  botToken: "123:QWEQWEWQ",
  allowedUsers: [myChatId] // Restrict control to known chat ID(s)
});
````

### Configuration Options

| Option          | Type        | Default | Description |
|----------------|------------|---------|-------------|
| `botToken`      | string     | —       | Telegram bot token *(required)* |
| `allowedUsers`  | number[]\|null | `null`  | Access control: `null` = restrict everyone, empty array = allow everyone |
| `help`          | boolean    | `true`  | Auto-add `/help` command |

> 📌 You must start a chat with your bot and obtain your **Telegram Chat ID**

---

## 💬 Sending Messages

```js
plugin.telegram.send(myChatId, "Bot started! 🚀");
```

Messages are skipped during backtests.

---

## 🔁 Return Value (Async, Never Throws)

`.send()` is asynchronous and always resolves — it **never throws** exceptions.
If you **don’t need** to confirm success, just call without `await`:

✔ Success response:

```js
{
  success: true,
  response: { /* ntfy response */ }
}
```

❌ Failure response:

```js
{
  success: false,
  error: "Description of what went wrong"
}
```

---

## 🧩 Command Handlers (Bot Control)

Register a command **without** the leading slash:

```js
plugin.telegram.onCommand("test", "Test command", ({ chatId, cmd, args, text }) => {
  plugin.telegram.send(chatId, "Bot running! 🚀");
});
```

This listens for `/start` in Telegram.

> Automatically included in `/help` output if a description is provided.

---

## 📨 Message Listener

React to normal user messages:

```js
plugin.telegram.onMessage(({ chatId, text }) => {
  plugin.telegram.send(chatId, `You said: ${text}`);
});
```

> ⚠️ Only **one** `onMessage()` callback can be registered.

---

## 📈 Trade Notifications

Example sending alerts for every order:

```js
trader.addHook("afterOrder", (order) => {
  plugin.telegram.send(myChatId, "Order Placed! " + order.side);
});
```

You may customize formatting to match your preferences.

---

## 🔐 Security & Access Control

If your bot is publicly reachable:

✔ Always specify `allowedUsers`

✔ Commands and messages from others are ignored silently

✔ Helps prevent unauthorized control of your bot


```js
allowedUsers: [1033333335]
```

---

## ⚠️ Network Access Requirements

This plugin communicates with:

* **api.telegram.org**

You must ensure network access is enabled for this domain
via the **Plugins → Telegram → Network Permission**.

Otherwise Telegram features will not work.

---

## 🧪 Example Complete Usage

```js
const myChatId = 1033333335;

trader.require("telegram", {
  botToken: "123:QWEQWEWQ",
  allowedUsers: [myChatId]
});

plugin.telegram.onCommand("start", "Start the bot", ({ chatId }) => {
  plugin.telegram.send(chatId, "Bot started! 🚀");
});

plugin.telegram.onCommand("status", "Show running info", ({ chatId }) => {
  plugin.telegram.send(chatId, "Everything is running normally 👍");
  plugin.telegram.send(chatId, plugin.telegram.buildHelpText());
});

plugin.telegram.onMessage(({ chatId, text }) => {
  plugin.telegram.send(chatId, `You said: ${text}`);
});

plugin.telegram.send(myChatId, "Bot Started! 🚀");

trader.addHook("afterOrder", (order) => {
  plugin.telegram.send(myChatId, "Order Given!\n" + formatOrder(order));
});
```

---

Stay informed. Stay in control.
**Manage your bot instantly from anywhere — via Telegram!** 📱🚀
