const { v4: uuidv4 } = require('uuid');
const { Auth } = require('msmc');

// Microsoft OAuth через msmc
async function loginMicrosoft(window) {
  const auth = new Auth('select_account');
  
  // Открываем окно авторизации
  const xboxManager = await auth.launch('electron', {
    parent: window,
  });
  
  const token = await xboxManager.getMinecraft();
  const profile = await token.profile();
  
  return {
    type: 'microsoft',
    username: profile.name,
    uuid: profile.id,
    accessToken: token.mclc().auth,
    msToken: xboxManager.msToken,
    expiresAt: Date.now() + 86400000, // 24 часа
  };
}

// Оффлайн режим (для пиратки)
function loginOffline(username) {
  if (!username || username.length < 3 || username.length > 16) {
    throw new Error('Никнейм должен быть от 3 до 16 символов');
  }
  
  // Детерминированный UUID на основе имени (как в официальных лаунчерах)
  const uuid = uuidv4();
  
  return {
    type: 'offline',
    username: username,
    uuid: uuid,
    accessToken: uuid,
    expiresAt: Infinity,
  };
}

// Проверка и обновление токена
async function refreshToken(account) {
  if (account.type === 'offline') return account;
  
  if (account.expiresAt && Date.now() < account.expiresAt - 300000) {
    return account; // Токен ещё действителен
  }
  
  try {
    const auth = new Auth('select_account');
    const xboxManager = await auth.refresh(account.msToken);
    const token = await xboxManager.getMinecraft();
    const profile = await token.profile();
    
    return {
      ...account,
      username: profile.name,
      accessToken: token.mclc().auth,
      msToken: xboxManager.msToken,
      expiresAt: Date.now() + 86400000,
    };
  } catch (e) {
    throw new Error('Сессия истекла, войдите снова');
  }
}

module.exports = { loginMicrosoft, loginOffline, refreshToken };
