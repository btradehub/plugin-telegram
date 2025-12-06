const defaultOptions = {
  botToken: undefined,
  log: true,
  pollInterval: 5000,
  help: true,
  allowedUsers: [], // if empty → allow everyone
};

const { trader, log, options, net } = api;
const {
  botToken,
  log: enableLog,
  pollInterval,
  help,
  allowedUsers,
} = { ...defaultOptions, ...options };

let lastUpdateId = 0;
const TELEGRAM_POLL_TIMEOUT = 25; // seconds
const commandHandlers = [];
let messageHandlerCb = null;

// Helpers
function logError(msg) {
  log('[Telegram⚠️] ' + msg);
}
function logSuccess(msg) {
  log('[Telegram✔️] ' + msg);
}
function isAllowed(chatId) {
  return (!Array.isArray(allowedUsers) && !!allowedUsers) || allowedUsers.length === 0 ||
    allowedUsers.includes(chatId);
}
function buildHelpText() {
  let txt = '📌 Available Commands:\n';
  for (const c of commandHandlers) {
    if (c.cmd === 'help') continue;
    txt += `/${c.cmd}`;
    if (c.description) txt += ` — ${c.description}`;
    txt += '\n';
  }
  return txt.trim() || 'No commands available.';
}
// -------
async function send(chatId, text) {
  if (!trader.liveMode) return;
  if (typeof text !== 'string') return { success: false, error: 'Invalid text' };

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const payload = { chat_id: chatId, text };

  try {
    const response = await net.post(url, payload);
    if (enableLog === true && response.status === 200) {
      logSuccess(`{${chatId}} ${text.substring(0, 50)}`);
    }
    return { success: true, response };
  } catch (error) {
    if (enableLog === true) {
      logError(`{${chatId}} ${error.message.substring(0, 100)}`);
    }
    return { success: false, error: error.message };
  }
}

trader.addHook('setup', () => {
  if (typeof botToken !== 'string') {
    logError('Missing or wrong config: botToken is required.');
  }
  if (!trader.liveMode) {
    logSuccess('Telegram disabled in backtest.')
  }
  if (help === true) {
    commandHandlers.push({
      cmd: 'help',
      description: 'Show command list',
      cb: ({ chatId }) => send(chatId, buildHelpText()),
    });
  }
});

// SEND
api.addUtil('send', send);

// COMMAND listener with description
api.addUtil('onCommand', function onCommand(cmd, description, cb) {
  if (typeof description === 'function') {
    cb = description;
    description = undefined;
  }
  if (typeof cmd !== 'string' || typeof cb !== 'function') {
    logError('onCommand(name, [desc], callback) required');
    return;
  }
  commandHandlers.push({ cmd, description, cb });
});

// MESSAGE listener
api.addUtil('onMessage', function onMessage(cb) {
  if (typeof cb !== 'function') {
    logError('onMessage(callback) required');
    return;
  }
  if (messageHandlerCb) {
    logError('Only one onMessage(callback) handler is allowed')
    return;
  }
  messageHandlerCb = cb;
});

api.addUtil('buildHelpText', buildHelpText)


// Polling
async function pollUpdates() {
  if (!trader.liveMode || !botToken) return;

  const url = `https://api.telegram.org/bot${botToken}/getUpdates?timeout=${TELEGRAM_POLL_TIMEOUT}&offset=${lastUpdateId + 1}`;

  try {
    const response = await net.get(url);
    const updates = response?.data?.result;
    if (!Array.isArray(updates)) return;

    for (const update of updates) {
      lastUpdateId = update.update_id;
      const msg = update.message;
      if (!msg?.text) continue;

      const chatId = msg.chat.id;
      const text = msg.text.trim();

      if (!isAllowed(chatId)) continue;

      if (text.startsWith('/')) {
        const parts = text.split(' ');
        const cmd = parts[0].slice(1);
        const args = parts.slice(1);

        for (const h of commandHandlers) {
          if (h.cmd === cmd) h.cb({ chatId, cmd, args, text });
        }
      } else {
        if (messageHandlerCb) {
          messageHandlerCb({ chatId, text });
        }
      }
    }
  } catch { }
  pollUpdates();
}

pollUpdates();
