/* Pixel Plaza: playable management systems layered onto the town prototype. */
(() => {
  'use strict';
  const root = document.getElementById('systems-root');
  const $ = (id) => document.getElementById(id);
  const catalog = [
    ['Cozy Cup','Café','☕','Food Street',true,35],['Sugar Whisk','Bakery','🥐','Food Street',false,45],['Scoop & Smile','Ice Cream Shop','🍦','Food Street',false,50],['Boba Bubble','Bubble Tea Shop','🧋','Food Street',false,55],
    ['Golden Petal','Jewellery Shop','💎','Fashion Street',true,65],['Peachy Threads','Clothing Boutique','👗','Fashion Street',false,70],['Little Steps','Shoe Store','👟','Fashion Street',false,70],['The Bag Garden','Handbag Shop','👜','Fashion Street',false,75],['Daisy Details','Accessories Shop','🎀','Fashion Street',false,60],
    ['Bloom & Blossom','Flower Shop','🌷','Creative Street',true,40],['Paper & Petal','Stationery Shop','✏️','Creative Street',false,45],['The Little Chapter','Bookstore','📚','Creative Street',false,55],['Wrapped Wonders','Gift Shop','🎁','Creative Street',false,60],['Glow & Gather','Candle Shop','🕯️','Creative Street',false,65],['Made of Magic','Handmade Crafts Shop','🧶','Creative Street',false,70],
    ['Tiny Toybox','Toy Shop','🧸','Lifestyle Street',true,50],['Dewdrop Beauty','Beauty & Skincare Shop','🧴','Lifestyle Street',false,65],['Paws & Whiskers','Pet Shop','🐾','Lifestyle Street',false,75],['Fern & Fig','Plant Shop','🪴','Lifestyle Street',false,55],['Sunny Basket','Fruit & Grocery Shop','🍓','Lifestyle Street',false,40]
  ];
  const products = {
    'Café':['Iced latte','Strawberry milk','Choco cookie'],
    'Bakery':['Berry cupcake','Butter croissant','Cinnamon roll'],
    'Ice Cream Shop':['Vanilla scoop','Berry sundae','Choco cone'],
    'Bubble Tea Shop':['Mango boba','Taro milk tea','Peach tea'],
    'Jewellery Shop':['Daisy necklace','Pearl bracelet','Star earrings'],
    'Clothing Boutique':['Pastel cardigan','Daisy skirt','Cosy sweater'],
    'Shoe Store':['Canvas sneakers','Mary Jane shoes','Comfy boots'],
    'Handbag Shop':['Mini tote','Heart purse','Everyday satchel'],
    'Accessories Shop':['Ribbon bow','Pearl hairclip','Sun hat'],
    'Flower Shop':['Daisy bouquet','Tulip bunch','Rose bundle'],
    'Stationery Shop':['Sticker sheet','Pastel notebook','Gel pen set'],
    'Bookstore':['Mystery novel','Garden journal','Fairy tale book'],
    'Gift Shop':['Surprise box','Birthday bundle','Tiny plush gift'],
    'Candle Shop':['Vanilla candle','Rose candle','Citrus candle'],
    'Handmade Crafts Shop':['Crochet charm','Beaded keychain','Mini felt plush'],
    'Toy Shop':['Teddy bear','Wooden train','Puzzle set'],
    'Beauty & Skincare Shop':['Lip balm','Hand cream','Face mist'],
    'Pet Shop':['Pet treats','Soft pet bed','Feather toy'],
    'Plant Shop':['Tiny succulent','Potted fern','Flower seeds'],
    'Fruit & Grocery Shop':['Berry basket','Apple bag','Fresh oranges']
  };
  const fresh = () => ({
    coins:120, level:1, reputation:0, sales:0, day:1, dailyRewardDate:'', dailyStreak:0, currentShop:'Cozy Cup',
    unlocked:['Cozy Cup','Golden Petal','Bloom & Blossom','Tiny Toybox'],
    inventory:{'Coffee beans':8,'Milk':8,'Sugar':8,'Paper bags':8,'Flower stems':8,'Gift wrap':8},
    wardrobe:{hair:'Chestnut bob',hairColor:'#754b3c',outfit:'Daisy dress',skin:'#e8b18e',accessory:'Pink bow',shoes:'Mary Janes'},
    pet:'Cat', petName:'Mochi', shopLevels:{}, completedTasks:[], settings:{music:35,sfx:55,language:'English',joystick:true}
  });
  let state;
  try { state = Object.assign(fresh(), JSON.parse(localStorage.getItem('pixelPlazaSave') || '{}')); } catch { state=fresh(); }
  state.inventory ||= fresh().inventory; state.unlocked ||= fresh().unlocked; state.wardrobe ||= fresh().wardrobe; state.settings ||= fresh().settings; state.shopLevels ||= {};
  let current = null, order = null, soundContext = null;
  const save = () => { try { localStorage.setItem('pixelPlazaSave',JSON.stringify(state)); } catch {} $('coins').textContent=state.coins; };
  const toast = (s) => { const el=$('toast'); if(!el)return; el.textContent=s;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),2100); };
  const esc = (s) => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  root.innerHTML = `
    <div class="systems-overlay hidden" id="system-panel"><section class="systems-window" role="dialog" aria-modal="true"><button class="systems-close" id="system-close">×</button><div id="system-content"></div></section></div>
    <div class="systems-overlay" id="start-screen"><section class="systems-window start-window"><div class="start-flower">✿</div><p class="systems-kicker">A LITTLE WORLD OF YOUR OWN</p><h1>Pixel Plaza</h1><p>Build your shops, meet lovely customers and make this town bloom.</p><div class="start-avatar">🧑🏻‍🍳 <span>♡</span> 🐱</div><button class="systems-primary" id="start-play">Continue your town</button><button class="systems-link" id="start-new">Start a new save</button><small>Progress saves automatically on this device.</small></section></div>`;
  const panel=$('system-panel'), content=$('system-content');
  function open(title,body){content.innerHTML='<p class="systems-kicker">PIXEL PLAZA</p><h2>'+title+'</h2>'+body;panel.classList.remove('hidden');}
  function close(){panel.classList.add('hidden');}
  function button(label,action,cls='systems-primary'){return '<button class="'+cls+'" data-action="'+esc(action)+'">'+label+'</button>';}
  function shopByName(name){return catalog.find(s=>s[0]===name);}
  function openShopPlay(shopName){
    const s=shopByName(shopName);if(!s)return;
    if(!state.unlocked.includes(shopName)){open('Shop locked','<p>Grow your town and unlock this lovely shop with coins.</p>');return;}
    state.currentShop=shopName;const stock=products[s[1]]||['Lovely product','Special item','Little treat'];
    const lv=state.shopLevels[shopName]||1;
    order={customer:['Mimi','Oliver','Pip','Clover','Sunny'][Math.floor(Math.random()*5)],mood:['in a hurry','a cheerful regular','a curious browser','looking for a gift'][Math.floor(Math.random()*4)],product:stock[Math.floor(Math.random()*stock.length)],price:12+lv*3};
    open(s[2]+' '+s[0],`<div class="shop-interior"><div class="interior-sign">${esc(s[1])} · LEVEL ${lv}</div><div class="counter-scene"><span>${s[2]}</span><span>🧺</span><span>🪴</span></div><div class="customer-card"><div class="customer-face">🙂</div><div><b>${order.customer} · ${order.mood}</b><p>“Hello! Could I get a ${esc(order.product)} please?”</p></div></div><div class="product-row">${stock.map((p,i)=>'<div class="product-tile"><span>'+['🍓','🎀','✨'][i]+'</span><small>'+esc(p)+'</small></div>').join('')}</div><p class="systems-note">Prepare the requested item and serve your customer to earn virtual coins.</p>${button('Prepare & serve · '+order.price+' coins','serve')}${button('Upgrade shop · '+((state.shopLevels[shopName]||1)*50)+' coins','upgrade','systems-secondary')}${button('Back to town','close','systems-secondary')}</div>`);
  }
  function serve(){
    if(!order)return;const reward=order.price;state.coins+=reward;state.sales++;state.reputation+=2;
    state.inventory['Paper bags']=Math.max(0,(state.inventory['Paper bags']||0)-1);
    if(state.sales%3===0)state.level++;
    toast('Order served! +'+reward+' coins');save();order=null;open('Lovely work!','<div class="reward-card"><span>✨</span><h3>Order complete</h3><p>You earned <b>'+reward+' coins</b> and made a customer happy.</p></div>'+button('Serve another customer','next-order')+button('Back to town','close','systems-secondary'));
  }
  function openWardrobe(){
    const w=state.wardrobe;
    open('Your character',`<div class="avatar-preview"><div class="avatar-pixel" style="--skin:${w.skin};--hair:${w.hairColor}">☺</div><div><b>${esc(w.outfit)}</b><small>${esc(w.hair)} · ${esc(w.accessory)}</small><small>${esc(w.shoes)}</small></div></div>
    <h3>Hairstyle</h3><div class="choice-grid">${['Chestnut bob','Long waves','Twin buns','Short curls'].map((v,i)=>choice('hair',v,w.hair,['🧑🏻','👩🏻','👧🏻','🧑🏽'][i])).join('')}</div>
    <h3>Hair colour</h3><div class="swatches">${['#754b3c','#3c302e','#d89b56','#c87586','#665d9b'].map(v=>'<button class="swatch" style="background:'+v+'" data-action="haircolor:'+v+'" aria-label="Choose hair colour"></button>').join('')}</div>
    <h3>Outfits</h3><div class="choice-grid">${['Daisy dress','Shopkeeper uniform','Casual overalls','Fashion set','Seasonal outfit'].map(v=>choice('outfit',v,w.outfit,'👗')).join('')}</div>
    <h3>Accessories & shoes</h3><div class="choice-grid">${['Pink bow','Mini bag','Flower clip','Mary Janes','Sneakers','Boots'].map(v=>choice(v.includes('Jane')||v.includes('Sneaker')||v==='Boots'?'shoes':'accessory',v,[w.shoes,w.accessory].includes(v)?v:'','🎀')).join('')}</div>
    <h3>Pet companion</h3><div class="choice-grid">${['Cat','Dog','Bunny','Duck'].map(v=>choice('pet',v,state.pet,({'Cat':'🐱','Dog':'🐶','Bunny':'🐰','Duck':'🦆'})[v])).join('')}</div><p class="systems-note">Your selected look and pet are saved automatically.</p>`);
  }
  function choice(key,val,active,icon){return '<button class="choice '+(val===active?'selected':'')+'" data-action="choose:'+key+':'+esc(val)+'"><span>'+icon+'</span>'+esc(val)+'</button>';}
  function openInventory(){
    const entries=Object.entries(state.inventory);
    open('Inventory & supplies','<p>Keep your shops stocked. Supplies are used as you serve customers.</p><div class="inventory-grid">'+entries.map(([k,v])=>'<div class="inventory-item"><span>📦</span><b>'+esc(k)+'</b><small>'+v+' in storage</small></div>').join('')+'</div>'+button('Restock supplies · 15 coins','restock')+button('Back to town','close','systems-secondary'));
  }
  function openTasks(){
    const tasks=[['serve3','Serve 3 customers',3,Math.min(state.sales,3)],['earn100','Earn 100 coins from sales',100,Math.min(state.sales*15,100)],['visit4','Open your town map','4',state.unlocked.length]];
    const today=new Date().toLocaleDateString();
    open('Daily tasks & rewards','<p>Little goals help your town grow. Rewards are virtual coins.</p><div class="reward-card"><span>🎁</span><h3>Daily welcome gift</h3><p>Come back each day for a little coin bonus.</p>'+button(state.dailyRewardDate===today?'Collected today ✓':'Collect daily gift · 25 coins','daily-reward',state.dailyRewardDate===today?'systems-secondary':'systems-primary')+'</div><div class="task-list">'+tasks.map(([id,label,goal,progress])=>'<div class="task-item"><b>'+esc(label)+'</b><small>'+(id==='earn100'?progress+' / '+goal:id==='serve3'?progress+' / '+goal:progress+' / '+goal+' shops open')+'</small>'+button(state.completedTasks.includes(id)?'Collected ✓':'Collect 20 coins','task:'+id,state.completedTasks.includes(id)?'systems-secondary':'systems-primary')+'</div>').join('')+'</div>'+button('Back to town','close','systems-secondary'));
  }
  function openSettings(){
    open('Settings',`<div class="setting-row"><label>Music volume</label><input type="range" min="0" max="100" value="${state.settings.music}" data-setting="music"><b>${state.settings.music}%</b></div><div class="setting-row"><label>Sound effects</label><input type="range" min="0" max="100" value="${state.settings.sfx}" data-setting="sfx"><b>${state.settings.sfx}%</b></div><div class="setting-row"><label>Language</label><select data-setting="language"><option>English</option><option>हिन्दी</option><option>मराठी</option></select></div><div class="setting-row"><label>Controls</label><span>Keyboard + mobile joystick</span></div><p class="systems-note">Your game saves automatically on this device.</p>${button('Save settings','save')}${button('Load saved game','load','systems-secondary')}${button('Back to town','close','systems-secondary')}`);
  }
  function openMap(){open('Town map','<div class="district-map">'+['Food Street','Fashion Street','Creative Street','Lifestyle Street'].map((d,i)=>'<div class="district-card"><b>'+['🍰','👗','🌷','🧸'][i]+' '+d+'</b><small>'+catalog.filter(s=>s[3]===d).length+' shops · '+catalog.filter(s=>s[3]===d&&state.unlocked.includes(s[0])).length+' open</small></div>').join('')+'</div><div class="fountain-map">⛲ CENTRAL PLAZA ⛲</div>'+button('Back to town','close','systems-secondary'));}
  function upgrade(){
    const name=state.currentShop, level=state.shopLevels[name]||1, cost=level*50;
    if(state.coins<cost){toast('You need '+cost+' coins for this upgrade.');return;}
    state.coins-=cost;state.shopLevels[name]=level+1;save();toast('Shop upgraded to level '+(level+1)+'!');
  }
  function unlockShop(){
    const next=catalog.find(s=>!state.unlocked.includes(s[0]));
    if(!next){toast('All shops are open!');return;}
    const cost=next[5];
    if(state.coins<cost){toast('Save up '+cost+' coins to unlock '+next[0]+'.');return;}
    state.coins-=cost;state.unlocked.push(next[0]);save();toast(next[0]+' is now open!');
  }
  function openProgress(){
    open('Town progress','<div class="progress-card"><b>Town level '+state.level+'</b><small>Customer happiness · '+state.reputation+' points</small><div class="progress-track"><span style="width:'+Math.min(100,state.reputation)+'%"></span></div><b>'+state.unlocked.length+' / 20 shops open</b><small>'+state.sales+' customers served</small></div>'+button('Unlock next shop','unlock')+button('View daily tasks','tasks')+button('Back to town','close','systems-secondary'));
  }
  function sound(){if(state.settings.sfx<=0)return;try{soundContext ||= new (window.AudioContext||window.webkitAudioContext)();const o=soundContext.createOscillator(),g=soundContext.createGain();o.connect(g);g.connect(soundContext.destination);o.frequency.value=660;g.gain.value=.035;o.start();o.stop(soundContext.currentTime+.08);}catch{}}
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-action]');if(!b)return;const a=b.dataset.action;
    if(a==='close'){close();return;}sound();
    if(a==='serve'){serve();return;}if(a==='next-order'){openShopPlay(state.currentShop);return;}if(a==='daily-reward'){const today=new Date().toLocaleDateString();if(state.dailyRewardDate===today){toast('You already collected today’s gift!');return;}state.dailyRewardDate=today;state.dailyStreak++;state.coins+=25;save();openTasks();toast('Daily gift collected! +25 coins');return;}
    if(a==='restock'){if(state.coins<15){toast('Not enough coins to restock.');return;}state.coins-=15;Object.keys(state.inventory).forEach(k=>state.inventory[k]+=5);save();openInventory();toast('Supplies restocked!');return;}
    if(a==='save'){save();toast('Game saved on this device!');return;}if(a==='load'){try{const loaded=JSON.parse(localStorage.getItem('pixelPlazaSave')||'null');if(loaded){state=Object.assign(fresh(),loaded);save();openSettings();toast('Saved town loaded!');}else toast('No saved town found yet.');}catch{toast('Could not load the saved town.');}return;}if(a==='upgrade'){upgrade();return;}if(a==='unlock'){unlockShop();openProgress();return;}if(a==='tasks'){openTasks();return;}
    if(a.startsWith('task:')){const id=a.split(':')[1];if(state.completedTasks.includes(id)){toast('Reward already collected.');return;}const eligible=id==='serve3'?state.sales>=3:id==='earn100'?state.sales*15>=100:state.unlocked.length>=4;if(!eligible){toast('Complete the task first!');return;}state.completedTasks.push(id);state.coins+=20;save();openTasks();toast('+20 coins reward!');return;}
    if(a.startsWith('choose:')){const [,key,val]=a.split(':');if(key==='pet'){state.pet=val;}else state.wardrobe[key]=val;save();openWardrobe();return;}
    if(a.startsWith('haircolor:')){state.wardrobe.hairColor=a.split(':')[1];save();openWardrobe();return;}
  },true);
  document.addEventListener('input',e=>{const k=e.target.dataset.setting;if(!k)return;state.settings[k]=k==='language'?e.target.value:Number(e.target.value);save();});
  document.addEventListener('change',e=>{const k=e.target.dataset.setting;if(k){state.settings[k]=k==='language'?e.target.value:Number(e.target.value);save();}});
  $('system-close').addEventListener('click',close);
  $('wardrobe-button').addEventListener('click',openWardrobe);
  $('bag-button').addEventListener('click',openInventory);
  $('settings-button').addEventListener('click',openSettings);
  $('map-button').addEventListener('click',openMap);
  $('help-button').addEventListener('click',openProgress);
  async function requestPhoneLandscape(){
    const phone = window.matchMedia('(max-width: 900px)').matches;
    if(!phone) return;
    try {
      if(!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      if(screen.orientation && screen.orientation.lock) {
        await screen.orientation.lock('landscape');
      }
    } catch (error) {
      // Some mobile browsers only allow manual rotation; the CSS prompt handles portrait mode.
      toast('For the best view, turn your phone sideways.');
    }
  }
  $('start-play').addEventListener('click',async()=>{$('start-screen').classList.add('hidden');save();await requestPhoneLandscape();});
  $('start-new').addEventListener('click',()=>{if(confirm('Start a new Pixel Plaza save? Your current local save will be replaced.')){state=fresh();save();$('start-screen').classList.add('hidden');toast('A fresh little town awaits!');}});
  // Replace the prototype's placeholder shop action before its target handler runs.
  $('shop-action').addEventListener('click',e=>{if(!$('shop-action').disabled){e.preventDefault();e.stopImmediatePropagation();const name=$('modal-title').textContent;$('modal-backdrop').classList.add('hidden');openShopPlay(name);}},true);
  $('modal-backdrop').addEventListener('click',e=>{if(e.target===$('modal-backdrop'))close();});
  // Add clear access to town progression and tasks without crowding the HUD.
  const progress=document.createElement('button');progress.className='progress-tab';progress.textContent='★ TASKS';progress.addEventListener('click',openTasks);document.querySelector('.game-frame').appendChild(progress);
  const upgradeTab=document.createElement('button');upgradeTab.className='progress-tab second-tab';upgradeTab.textContent='🏡 TOWN';upgradeTab.addEventListener('click',openProgress);document.querySelector('.game-frame').appendChild(upgradeTab);
  const style=document.createElement('style');style.textContent=`
  .systems-overlay{position:fixed;inset:0;background:#49372dc9;z-index:30;display:grid;place-items:center;padding:16px;overflow:auto}.systems-overlay.hidden{display:none}.systems-window{position:relative;width:min(560px,100%);max-height:min(88dvh,850px);overflow:auto;background:#fff8ed;border:4px solid #805c4d;border-radius:20px;padding:25px;box-shadow:0 8px 0 #583e35;color:#604439}.systems-window h2{text-align:center;font-size:27px;margin:4px 0 15px}.systems-window h3{font-size:14px;margin:17px 0 8px}.systems-window p{font-size:13px;color:#947361}.systems-kicker{text-align:center!important;letter-spacing:2px;font-size:9px!important;font-weight:900;color:#c18470!important}.systems-close{position:sticky;float:right;top:0;margin:-12px -10px 0 0;border:0;background:none;font-size:27px;color:#805c4d;cursor:pointer;z-index:1}.systems-primary,.systems-secondary,.systems-link{width:100%;border:2px solid #765344;border-radius:12px;padding:11px;margin-top:9px;font:900 13px Nunito;cursor:pointer}.systems-primary{background:#d98979;color:#fff;box-shadow:0 3px 0 #765344}.systems-secondary{background:#f2e4d5;color:#765344}.systems-link{border:0;background:none;color:#a77662}.start-window{text-align:center;width:min(420px,100%);padding:35px}.start-window h1{font-size:38px;margin:0;color:#68483c}.start-flower{font-size:45px;color:#d98979}.start-avatar{font-size:54px;margin:18px}.start-avatar span{font-size:22px;color:#d98979}.start-window small{display:block;color:#a58978;margin-top:14px}.shop-interior{background:#f4e5d4;border:2px solid #d4b49b;border-radius:14px;padding:12px}.interior-sign{text-align:center;font-size:10px;letter-spacing:1px;font-weight:900}.counter-scene{height:85px;background:#e5c5a7;border:2px solid #a77d63;border-radius:12px;display:flex;align-items:center;justify-content:space-around;font-size:38px;margin:10px 0}.customer-card{display:flex;gap:10px;align-items:center;background:#fff9ef;border-radius:12px;padding:10px}.customer-face{font-size:30px}.customer-card p{margin:3px 0}.product-row,.choice-grid,.inventory-grid,.district-map{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:12px 0}.product-tile,.inventory-item{background:#fff8ed;border:1px solid #d7b89c;border-radius:10px;padding:9px;text-align:center}.product-tile span,.inventory-item span{display:block;font-size:24px}.product-tile small,.inventory-item small{display:block;font-size:10px;color:#927362}.systems-note{font-size:11px!important}.avatar-preview{display:flex;align-items:center;gap:15px;background:#f3e2d1;padding:12px;border-radius:12px}.avatar-pixel{width:65px;height:65px;border:4px solid #805c4d;border-radius:14px;background:var(--skin);display:grid;place-items:center;font-size:38px;color:var(--hair);box-shadow:inset 0 12px var(--hair)}.avatar-preview small{display:block;color:#9a7a68}.choice{border:2px solid #ddc2a8;background:#fffaf2;border-radius:10px;padding:8px;font:700 11px Nunito;color:#68483c}.choice span{display:block;font-size:22px}.choice.selected{border-color:#d98979;background:#fbe5dc}.swatches{display:flex;gap:10px}.swatch{width:30px;height:30px;border:2px solid #765344;border-radius:50%}.task-list{display:grid;gap:9px}.task-item{border:1px solid #ddc4ab;background:#fffaf3;border-radius:12px;padding:10px}.task-item small{display:block;color:#9b7d69}.task-item button{padding:7px}.setting-row{display:grid;grid-template-columns:1fr 1fr auto;gap:8px;align-items:center;margin:15px 0;font-size:12px}.setting-row input{width:100%}.setting-row select{grid-column:span 2;padding:7px;border:1px solid #d2b39a;border-radius:8px}.progress-card{background:#f5e5d5;border-radius:12px;padding:14px;display:grid;gap:8px}.progress-card small{color:#997965}.progress-track{height:10px;border-radius:20px;background:#e0c9b2;overflow:hidden}.progress-track span{display:block;height:100%;background:#9fbe92}.district-card{background:#f5e6d7;border:1px solid #dec4aa;border-radius:10px;padding:12px;font-size:12px}.district-card small{display:block;color:#967865}.fountain-map{text-align:center;padding:13px;background:#e7e4cf;border-radius:12px;font-weight:900}.reward-card{text-align:center;background:#f7e8d8;border-radius:14px;padding:15px}.reward-card span{font-size:38px}.reward-card h3{font-size:20px}.progress-tab{position:absolute;z-index:3;right:14px;bottom:48px;border:2px solid #805c4d;border-radius:20px;background:#fff5e7;color:#765344;font:900 10px Nunito;padding:8px 12px;cursor:pointer}.second-tab{right:100px}@media(max-width:650px){.systems-window{padding:19px}.product-row,.choice-grid{grid-template-columns:repeat(2,1fr)}.progress-tab{bottom:128px;right:12px}.second-tab{right:94px}.systems-window h2{font-size:23px}}`;
  document.head.appendChild(style);save();
  // Game actions are exposed for the existing canvas shop modal.
  window.PixelPlaza={openShop:openShopPlay,save:()=>{save();toast('Game saved!');},getState:()=>JSON.parse(JSON.stringify(state))};
})();