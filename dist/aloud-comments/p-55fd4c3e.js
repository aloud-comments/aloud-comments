let e,t,n=!1;const l="undefined"!=typeof window?window:{},s=l.document||{head:{}},o={t:0,l:"",jmp:e=>e(),raf:e=>requestAnimationFrame(e),ael:(e,t,n,l)=>e.addEventListener(t,n,l),rel:(e,t,n,l)=>e.removeEventListener(t,n,l),ce:(e,t)=>new CustomEvent(e,t)},i=e=>Promise.resolve(e),r=(()=>{try{return new CSSStyleSheet,!0}catch(e){}return!1})(),c=new WeakMap,u=e=>"sc-"+e.o,a={},f=e=>"object"==(e=typeof e)||"function"===e,$=(e,t,...n)=>{let l=null,s=null,o=!1,i=!1,r=[];const c=t=>{for(let n=0;n<t.length;n++)l=t[n],Array.isArray(l)?c(l):null!=l&&"boolean"!=typeof l&&((o="function"!=typeof e&&!f(l))&&(l+=""),o&&i?r[r.length-1].i+=l:r.push(o?d(null,l):l),i=o)};if(c(n),t){t.key&&(s=t.key);{const e=t.className||t.class;e&&(t.class="object"!=typeof e?e:Object.keys(e).filter((t=>e[t])).join(" "))}}const u=d(e,null);return u.u=t,r.length>0&&(u.$=r),u.m=s,u},d=(e,t)=>({t:0,p:e,i:t,h:null,$:null,u:null,m:null}),m={},y=(e,t,n,s,i,r)=>{if(n!==s){let c=z(e,t),u=t.toLowerCase();if("class"===t){const t=e.classList,l=h(n),o=h(s);t.remove(...l.filter((e=>e&&!o.includes(e)))),t.add(...o.filter((e=>e&&!l.includes(e))))}else if("style"===t){for(const t in n)s&&null!=s[t]||(t.includes("-")?e.style.removeProperty(t):e.style[t]="");for(const t in s)n&&s[t]===n[t]||(t.includes("-")?e.style.setProperty(t,s[t]):e.style[t]=s[t])}else if("key"===t);else if("ref"===t)s&&s(e);else if(c||"o"!==t[0]||"n"!==t[1]){const l=f(s);if((c||l&&null!==s)&&!i)try{if(e.tagName.includes("-"))e[t]=s;else{let l=null==s?"":s;"list"===t?c=!1:null!=n&&e[t]==l||(e[t]=l)}}catch(e){}null==s||!1===s?!1===s&&""!==e.getAttribute(t)||e.removeAttribute(t):(!c||4&r||i)&&!l&&e.setAttribute(t,s=!0===s?"":s)}else t="-"===t[2]?t.slice(3):z(l,u)?u.slice(2):u[2]+t.slice(3),n&&o.rel(e,t,n,!1),s&&o.ael(e,t,s,!1)}},p=/\s/,h=e=>e?e.split(p):[],b=(e,t,n,l)=>{const s=11===t.h.nodeType&&t.h.host?t.h.host:t.h,o=e&&e.u||a,i=t.u||a;for(l in o)l in i||y(s,l,o[l],void 0,n,t.t);for(l in i)y(s,l,o[l],i[l],n,t.t)},w=(t,n,l)=>{let o,i,r=n.$[l],c=0;if(null!==r.i)o=r.h=s.createTextNode(r.i);else if(o=r.h=s.createElement(r.p),b(null,r,!1),null!=e&&o["s-si"]!==e&&o.classList.add(o["s-si"]=e),r.$)for(c=0;c<r.$.length;++c)i=w(t,r,c),i&&o.appendChild(i);return o},g=(e,n,l,s,o,i)=>{let r,c=e;for(c.shadowRoot&&c.tagName===t&&(c=c.shadowRoot);o<=i;++o)s[o]&&(r=w(null,l,o),r&&(s[o].h=r,c.insertBefore(r,n)))},j=(e,t,n,l,s)=>{for(;t<=n;++t)(l=e[t])&&(s=l.h,S(l),s.remove())},k=(e,t)=>e.p===t.p&&e.m===t.m,v=(e,t)=>{const n=t.h=e.h,l=e.$,s=t.$,o=t.i;null===o?(b(e,t,!1),null!==l&&null!==s?((e,t,n,l)=>{let s,o,i=0,r=0,c=0,u=0,a=t.length-1,f=t[0],$=t[a],d=l.length-1,m=l[0],y=l[d];for(;i<=a&&r<=d;)if(null==f)f=t[++i];else if(null==$)$=t[--a];else if(null==m)m=l[++r];else if(null==y)y=l[--d];else if(k(f,m))v(f,m),f=t[++i],m=l[++r];else if(k($,y))v($,y),$=t[--a],y=l[--d];else if(k(f,y))v(f,y),e.insertBefore(f.h,$.h.nextSibling),f=t[++i],y=l[--d];else if(k($,m))v($,m),e.insertBefore($.h,f.h),$=t[--a],m=l[++r];else{for(c=-1,u=i;u<=a;++u)if(t[u]&&null!==t[u].m&&t[u].m===m.m){c=u;break}c>=0?(o=t[c],o.p!==m.p?s=w(t&&t[r],n,c):(v(o,m),t[c]=void 0,s=o.h),m=l[++r]):(s=w(t&&t[r],n,r),m=l[++r]),s&&f.h.parentNode.insertBefore(s,f.h)}i>a?g(e,null==l[d+1]?null:l[d+1].h,n,l,r,d):r>d&&j(t,i,a)})(n,l,t,s):null!==s?(null!==e.i&&(n.textContent=""),g(n,null,t,s,0,s.length-1)):null!==l&&j(l,0,l.length-1)):e.i!==o&&(n.data=o)},S=e=>{e.u&&e.u.ref&&e.u.ref(null),e.$&&e.$.map(S)},M=(e,t,n)=>{const l=(e=>N(e).g)(e);return{emit:e=>O(l,t,{bubbles:!!(4&n),composed:!!(2&n),cancelable:!!(1&n),detail:e})}},O=(e,t,n)=>{const l=o.ce(t,n);return e.dispatchEvent(l),l},C=(e,t)=>{t&&!e.j&&t["s-p"]&&t["s-p"].push(new Promise((t=>e.j=t)))},P=(e,t)=>{if(e.t|=16,!(4&e.t))return C(e,e.k),ee((()=>x(e,t)));e.t|=512},x=(e,t)=>{const n=e.v;let l;return t&&(l=A(n,"componentWillLoad")),F(l,(()=>E(e,n,t)))},E=async(n,l,o)=>{const i=n.g,r=i["s-rc"];o&&(e=>{const t=e.S,n=e.g,l=t.t,o=((e,t)=>{let n=u(t),l=I.get(n);if(e=11===e.nodeType?e:s,l)if("string"==typeof l){let t,o=c.get(e=e.head||e);o||c.set(e,o=new Set),o.has(n)||(t=s.createElement("style"),t.innerHTML=l,e.insertBefore(t,e.querySelector("link")),o&&o.add(n))}else e.adoptedStyleSheets.includes(l)||(e.adoptedStyleSheets=[...e.adoptedStyleSheets,l]);return n})(n.shadowRoot?n.shadowRoot:n.getRootNode(),t);10&l&&(n["s-sc"]=o,n.classList.add(o+"-h"),2&l&&n.classList.add(o+"-s"))})(n);((n,l)=>{const s=n.g,o=n.S,i=n.M||d(null,null),r=(e=>e&&e.p===m)(l)?l:$(null,null,l);t=s.tagName,o.O&&(r.u=r.u||{},o.O.map((([e,t])=>r.u[t]=s[e]))),r.p=null,r.t|=4,n.M=r,r.h=i.h=s.shadowRoot||s,e=s["s-sc"],v(i,r)})(n,L(n,l)),r&&(r.map((e=>e())),i["s-rc"]=void 0);{const e=i["s-p"],t=()=>T(n);0===e.length?t():(Promise.all(e).then(t),n.t|=4,e.length=0)}},L=(e,t)=>{try{t=t.render(),e.t&=-17,e.t|=2}catch(t){B(t,e.g)}return t},T=e=>{const t=e.g,n=e.k;64&e.t||(e.t|=64,H(t),e.C(t),n||W()),e.P(t),e.j&&(e.j(),e.j=void 0),512&e.t&&Z((()=>P(e,!1))),e.t&=-517},W=()=>{H(s.documentElement),Z((()=>O(l,"appload",{detail:{namespace:"aloud-comments"}})))},A=(e,t,n)=>{if(e&&e[t])try{return e[t](n)}catch(e){B(e)}},F=(e,t)=>e&&e.then?e.then(t):t(),H=e=>e.classList.add("hydrated"),R=(e,t,n)=>{if(t.L){const l=Object.entries(t.L),s=e.prototype;if(l.map((([e,[l]])=>{31&l||2&n&&32&l?Object.defineProperty(s,e,{get(){return((e,t)=>N(this).T.get(t))(0,e)},set(n){((e,t,n,l)=>{const s=N(e),o=s.T.get(t),i=s.t,r=s.v;n=((e,t)=>null==e||f(e)?e:4&t?"false"!==e&&(""===e||!!e):2&t?parseFloat(e):1&t?e+"":e)(n,l.L[t][0]),8&i&&void 0!==o||n===o||(s.T.set(t,n),r&&2==(18&i)&&P(s,!1))})(this,e,n,t)},configurable:!0,enumerable:!0}):1&n&&64&l&&Object.defineProperty(s,e,{value(...t){const n=N(this);return n.W.then((()=>n.v[e](...t)))}})})),1&n){const n=new Map;s.attributeChangedCallback=function(e,t,l){o.jmp((()=>{const t=n.get(e);this[t]=(null!==l||"boolean"!=typeof this[t])&&l}))},e.observedAttributes=l.filter((([e,t])=>15&t[0])).map((([e,l])=>{const s=l[1]||e;return n.set(s,e),512&l[0]&&t.O.push([e,s]),s}))}}return e},U=(e,t={})=>{const n=[],i=t.exclude||[],c=l.customElements,a=s.head,f=a.querySelector("meta[charset]"),$=s.createElement("style"),d=[];let m,y=!0;Object.assign(o,t),o.l=new URL(t.resourcesUrl||"./",s.baseURI).href,e.map((e=>e[1].map((t=>{const l={t:t[0],o:t[1],L:t[2],A:t[3]};l.L=t[2],l.O=[];const s=l.o,a=class extends HTMLElement{constructor(e){super(e),_(e=this,l),1&l.t&&e.attachShadow({mode:"open"})}connectedCallback(){m&&(clearTimeout(m),m=null),y?d.push(this):o.jmp((()=>(e=>{if(0==(1&o.t)){const t=N(e),n=t.S,l=()=>{};if(!(1&t.t)){t.t|=1;{let n=e;for(;n=n.parentNode||n.host;)if(n["s-p"]){C(t,t.k=n);break}}n.L&&Object.entries(n.L).map((([t,[n]])=>{if(31&n&&e.hasOwnProperty(t)){const n=e[t];delete e[t],e[t]=n}})),(async(e,t,n,l,s)=>{if(0==(32&t.t)){{if(t.t|=32,(s=G(n)).then){const e=()=>{};s=await s,e()}s.isProxied||(R(s,n,2),s.isProxied=!0);const e=()=>{};t.t|=8;try{new s(t)}catch(e){B(e)}t.t&=-9,e()}if(s.style){let e=s.style;const t=u(n);if(!I.has(t)){const l=()=>{};((e,t,n)=>{let l=I.get(e);r&&n?(l=l||new CSSStyleSheet,l.replace(t)):l=t,I.set(e,l)})(t,e,!!(1&n.t)),l()}}}const o=t.k,i=()=>P(t,!0);o&&o["s-rc"]?o["s-rc"].push(i):i()})(0,t,n)}l()}})(this)))}disconnectedCallback(){o.jmp((()=>{}))}componentOnReady(){return N(this).F}};l.H=e[0],i.includes(s)||c.get(s)||(n.push(s),c.define(s,R(a,l,1)))})))),$.innerHTML=n+"{visibility:hidden}.hydrated{visibility:inherit}",$.setAttribute("data-styles",""),a.insertBefore($,f?f.nextSibling:a.firstChild),y=!1,d.length?d.map((e=>e.connectedCallback())):o.jmp((()=>m=setTimeout(W,30)))},q=new WeakMap,N=e=>q.get(e),V=(e,t)=>q.set(t.v=e,t),_=(e,t)=>{const n={t:0,g:e,S:t,T:new Map};return n.W=new Promise((e=>n.P=e)),n.F=new Promise((e=>n.C=e)),e["s-p"]=[],e["s-rc"]=[],q.set(e,n)},z=(e,t)=>t in e,B=(e,t)=>(0,console.error)(e,t),D=new Map,G=e=>{const t=e.o.replace(/-/g,"_"),n=e.H,l=D.get(n);return l?l[t]:import(`./${n}.entry.js`).then((e=>(D.set(n,e),e[t])),B)},I=new Map,J=[],K=[],Q=(e,t)=>l=>{e.push(l),n||(n=!0,t&&4&o.t?Z(Y):o.raf(Y))},X=e=>{for(let t=0;t<e.length;t++)try{e[t](performance.now())}catch(e){B(e)}e.length=0},Y=()=>{X(J),X(K),(n=J.length>0)&&o.raf(Y)},Z=e=>i().then(e),ee=Q(K,!0);export{m as H,U as b,M as c,$ as h,i as p,V as r}