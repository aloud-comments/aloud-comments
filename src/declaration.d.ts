declare module 'https://unpkg.com/*';
declare module 'https://www.gstatic.com/firebasejs/ui/4.7.1/firebase-ui-auth.js' {
  const firebaseui: typeof import('firebaseui')
  export = firebaseui;
}
