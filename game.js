(() => {
  const canvas = document.getElementById('town');
  const ctx = canvas.getContext('2d');
  const coinsEl = document.getElementById('coins');
  const toastEl = document.getElementById('toast');
  const modal = document.getElementById('modal-backdrop');
  const infoModal = document.getElementById('info-backdrop');
  const keys = new Set();
  const tileW = 64, tileH = 32;
  const origin = {x:480,y:112};
  let coins = 120, selectedShop = null, toastTimer, lastTime = 0;
  const player = {x:0,y:0,face:1,walk:0};
  const shops = [
    {id:1,name:'Cozy Cup',type:'Café',street:'Food Street',icon:'☕',x:-4,y:-3,desc:'A warm little café serving cosy drinks and sweet treats.',open:true},
    {id:2,name:'Sugar Whisk',type:'Bakery',street:'Food Street',icon:'🥐',x:-2,y:-4,desc:'Fresh breads, cupcakes and lovely pastries.',open:false},
    {id:3,name:'Scoop & Smile',type:'Ice Cream Shop',street:'Food Street',icon:'🍦',x:0,y:-4,desc:'Colourful scoops, cones and frozen delights.',open:false},
    {id:4,name:'Boba Bubble',type:'Bubble Tea Shop',street:'Food Street',icon:'🧋',x:2,y:-3,desc:'A cheerful bubble tea stop with lots of flavours.',open:false},
    {id:5,name:'Golden Petal',type:'Jewellery Shop',street:'Fashion Street',icon:'💎',x:4,y:-2,desc:'Pretty jewellery and little treasures.',open:true},
    {id:6,name:'Peachy Threads',type:'Clothing Boutique',street:'Fashion Street',icon:'👗',x:4,y:0,desc:'Cute outfits for every kind of day.',open:false},
    {id:7,name:'Little Steps',type:'Shoe Store',street:'Fashion Street',icon:'👟',x:3,y:2,desc:'Shoes for strolling around the plaza.',open:false},
    {id:8,name:'The Bag Garden',type:'Handbag Shop',street:'Fashion Street',icon:'👜',x:2,y:3,desc:'Handbags, totes and tiny purses.',open:false},
    {id:9,name:'Daisy Details',type:'Accessories Shop',street:'Fashion Street',icon:'🎀',x:1,y:4,desc:'Bows, hats and lovely accessories.',open:false},
    {id:10,name:'Bloom & Blossom',type:'Flower Shop',street:'Creative Street',icon:'🌷',x:-4,y:2,desc:'Make beautiful bouquets with fresh flowers.',open:true},
    {id:11,name:'Paper & Petal',type:'Stationery Shop',street:'Creative Street',icon:'✏️',x:-4,y:4,desc:'Notebooks, pens, stickers and more.',open:false},
    {id:12,name:'The Little Chapter',type:'Bookstore',street:'Creative Street',icon:'📚',x:-3,y:5,desc:'A quiet nook filled with stories.',open:false},
    {id:13,name:'Wrapped Wonders',type:'Gift Shop',street:'Creative Street',icon:'🎁',x:-2,y:5,desc:'Thoughtful gifts for every occasion.',open:false},
    {id:14,name:'Glow & Gather',type:'Candle Shop',street:'Creative Street',icon:'🕯️',x:-1,y:5,desc:'Cosy candles and gentle scents.',open:false},
    {id:15,name:'Made of Magic',type:'Handmade Crafts Shop',street:'Creative Street',icon:'🧶',x:-5,y:3,desc:'Handmade treasures and craft kits.',open:false},
    {id:16,name:'Tiny Toybox',type:'Toy Shop',street:'Lifestyle Street',icon:'🧸',x:4,y:4,desc:'Toys, games and little surprises.',open:true},
    {id:17,name:'Dewdrop Beauty',type:'Beauty & Skincare Shop',street:'Lifestyle Street',icon:'🧴',x:5,y:3,desc:'Gentle beauty treats and skincare goodies.',open:false},
    {id:18,name:'Paws & Whiskers',type:'Pet Shop',street:'Lifestyle Street',icon:'🐾',x:5,y:1,desc:'Meet adorable pets and find their essentials.',open:false},
    {id:19,name:'Fern & Fig',type:'Plant Shop',street:'Lifestyle Street',icon:'🪴',x:5,y:-1,desc:'Bring home a little bit of green.',open:false},
    {id:20,name:'Sunny Basket',type:'Fruit & Grocery Shop',street:'Lifestyle Street',icon:'🍓',x:3,y:-3,desc:'Fresh fruit and everyday market finds.',open:false}
  ];
  const districts = ['Food Street','Fashion Street','Creative Street','Lifestyle Street'];
  function iso(x,y){return {x:origin.x+(x-y)*tileW/2,y:origin.y+(x+y)*tileH/2};}
  function poly(points,fill,stroke){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}}
  function diamond(x,y,w,h,fill,stroke){poly([{x,y:y-h/2},{x:x+w/2,y},{x,y:y+h/2},{x:x-w/2,y}],fill,stroke);}
  function drawTile(x,y,fill){const p=iso(x,y);diamond(p.x,p.y,tileW,tileH,fill,'#8ca982');}
  function drawBuilding(shop){
    const p=iso(shop.x,shop.y), w=62, h=42, bh=47;
    // soft shadow and side walls
    poly([{x:p.x-w/2,y:p.y-h/2},{x:p.x,y:p.y-h/2+14},{x:p.x,y:p.y-h/2+14+bh},{x:p.x-w/2,y:p.y-h/2+bh}], '#b97e69','#765344');
    poly([{x:p.x,y:p.y-h/2+14},{x:p.x+w/2,y:p.y-h/2},{x:p.x+w/2,y:p.y-h/2+bh},{x:p.x,y:p.y-h/2+14+bh}], '#d49a7f','#765344');
    poly([{x:p.x-w/2,y:p.y-h/2},{x:p.x,y:p.y-h/2-14},{x:p.x+w/2,y:p.y-h/2},{x:p.x,y:p.y-h/2+14}],shop.open?'#e8b5a1':'#b6a49a','#765344');
    // striped awning
    ctx.fillStyle=shop.open?'#fff0d9':'#ddd2c8';ctx.fillRect(p.x-20,p.y-27,40,15);
    ctx.fillStyle=shop.open?'#d98979':'#9e9188';for(let i=0;i<5;i++)ctx.fillRect(p.x-20+i*8,p.y-27,4,15);
    ctx.strokeStyle='#765344';ctx.lineWidth=2;ctx.strokeRect(p.x-20,p.y-27,40,15);
    ctx.fillStyle='#fff7e9';ctx.fillRect(p.x-10,p.y-12,20,19);ctx.strokeRect(p.x-10,p.y-12,20,19);
    ctx.fillStyle='#765344';ctx.fillRect(p.x-3,p.y-10,6,17);
    ctx.font='18px sans-serif';ctx.textAlign='center';ctx.fillText(shop.icon,p.x,p.y-38);
    ctx.fillStyle='#fff8eb';ctx.strokeStyle='#805d4d';ctx.lineWidth=2;ctx.fillRect(p.x-37,p.y-62,74,16);ctx.strokeRect(p.x-37,p.y-62,74,16);
    ctx.fillStyle='#67483c';ctx.font='bold 9px Nunito, sans-serif';ctx.fillText(shop.name,p.x,p.y-51);
    if(!shop.open){ctx.fillStyle='#67483c';ctx.font='bold 8px Nunito';ctx.fillText('LOCKED',p.x,p.y+18);}
    shop.hit={x:p.x,y:p.y-22,r:42};
  }
  function drawTree(x,y){const p=iso(x,y);ctx.fillStyle='#8c654c';ctx.fillRect(p.x-4,p.y-17,8,22);ctx.fillStyle='#78a879';ctx.fillRect(p.x-16,p.y-39,32,25);ctx.fillStyle='#9cc18b';ctx.fillRect(p.x-10,p.y-45,20,12);ctx.strokeStyle='#628b68';ctx.strokeRect(p.x-16,p.y-39,32,25);}
  function drawScene(){
    ctx.clearRect(0,0,960,640);
    ctx.fillStyle='#c8dcb9';ctx.fillRect(0,0,960,640);
    // checkerboard park tiles
    for(let y=-8;y<=9;y++)for(let x=-9;x<=9;x++){let c=(x+y)%2===0?'#c7d9b5':'#bdd2aa';drawTile(x,y,c);}
    // roads crossing through the plaza
    for(let i=-8;i<=8;i++){let a=iso(i,0);diamond(a.x,a.y,66,34,'#d9c2a5','#b69a80');let b=iso(0,i);diamond(b.x,b.y,66,34,'#d9c2a5','#b69a80');}
    // plaza center
    const center=iso(0,0);diamond(center.x,center.y,108,54,'#ead8bb','#b69a80');
    ctx.fillStyle='#8bb7b3';ctx.beginPath();ctx.ellipse(center.x,center.y-3,30,15,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#fff1d8';ctx.lineWidth=4;ctx.stroke();
    ctx.fillStyle='#f2d27f';ctx.fillRect(center.x-3,center.y-30,6,22);ctx.fillRect(center.x-11,center.y-23,22,5);ctx.fillStyle='#fff1c8';ctx.beginPath();ctx.arc(center.x,center.y-34,5,0,Math.PI*2);ctx.fill();
    // street labels
    ctx.font='900 13px Nunito';ctx.textAlign='center';ctx.fillStyle='#fff8e9';ctx.strokeStyle='#8a6a54';ctx.lineWidth=3;
    [['FOOD STREET',-2,-7],['FASHION STREET',7,-1],['CREATIVE STREET',-7,4],['LIFESTYLE STREET',6,6]].forEach(([t,x,y])=>{let p=iso(x,y);ctx.strokeText(t,p.x,p.y);ctx.fillText(t,p.x,p.y);});
    drawTree(-7,-5);drawTree(7,-5);drawTree(-7,7);drawTree(7,7);
    shops.slice().sort((a,b)=>(a.x+a.y)-(b.x+b.y)).forEach(drawBuilding);
    // player
    const pp=iso(player.x,player.y);
    ctx.fillStyle='#765344';ctx.fillRect(pp.x-9,pp.y+1,7,11);ctx.fillRect(pp.x+3,pp.y+1,7,11);
    ctx.fillStyle='#e8a78f';ctx.fillRect(pp.x-10,pp.y-22,20,22);ctx.fillStyle='#5b4038';ctx.fillRect(pp.x-11,pp.y-27,22,9);ctx.fillRect(pp.x-12,pp.y-23,5,9);
    ctx.fillStyle='#fff4df';ctx.fillRect(pp.x-8,pp.y-15,16,12);ctx.fillStyle='#5b4038';ctx.fillRect(pp.x+(player.face>0?2:-5),pp.y-19,3,3);
    ctx.fillStyle='#fff4df';ctx.fillRect(pp.x-18,pp.y+14,36,5);
  }
  function showToast(message){toastEl.textContent=message;toastEl.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toastEl.classList.remove('show'),1900);}
  function openShop(shop){
    selectedShop=shop;
    document.getElementById('modal-icon').textContent=shop.icon;
    document.getElementById('modal-district').textContent=shop.street.toUpperCase();
    document.getElementById('modal-title').textContent=shop.name;
    document.getElementById('modal-description').textContent=shop.desc;
    const status=document.getElementById('shop-status');
    status.textContent=shop.open?'OPEN FOR BUSINESS':'COMING SOON · UNLOCK AS YOU PLAY';
    status.classList.toggle('locked',!shop.open);
    const action=document.getElementById('shop-action');action.disabled=!shop.open;action.textContent=shop.open?'Enter shop':'Not unlocked yet';
    modal.classList.remove('hidden');
  }
  function interact(){
    const here=iso(player.x,player.y);
    const nearby=shops.map(s=>({s,d:Math.hypot(iso(s.x,s.y).x-here.x,iso(s.x,s.y).y-here.y)})).sort((a,b)=>a.d-b.d)[0];
    if(nearby&&nearby.d<95)openShop(nearby.s);else showToast('Walk closer to a shop to interact!');
  }
  function move(dx,dy,dt){
    const speed=2.5*dt;
    if(dx||dy){player.x=Math.max(-7,Math.min(7,player.x+dx*speed));player.y=Math.max(-7,Math.min(7,player.y+dy*speed));player.face=dx>=0?1:-1;player.walk+=dt;}
  }
  function loop(t){const dt=Math.min((t-lastTime)/16.67||1,2);lastTime=t;let dx=0,dy=0;if(keys.has('ArrowLeft')||keys.has('a')){dx=-1;dy=0;}if(keys.has('ArrowRight')||keys.has('d')){dx=1;dy=0;}if(keys.has('ArrowUp')||keys.has('w')){dx=0;dy=-1;}if(keys.has('ArrowDown')||keys.has('s')){dx=0;dy=1;}move(dx,dy,dt);drawScene();requestAnimationFrame(loop);}
  function showInfo(map){document.getElementById('info-title').textContent=map?'Town map':'How to play';const content=document.getElementById('info-content');if(map){content.innerHTML='<p>Explore four connected streets around the central fountain.</p><div class="map-list">'+districts.map(d=>'<div>✿ '+d+'<small>'+shops.filter(s=>s.street===d).length+' shops</small></div>').join('')+'</div><p>Tap any shop on the town screen to see its details. Locked shops will open as your town grows.</p>';}else{content.innerHTML='<p><b>Move:</b> WASD or arrow keys. On touch screens, use the joystick.</p><p><b>Visit:</b> Tap a shop, or walk near it and press TALK / INTERACT.</p><p><b>Explore:</b> Four streets, 20 planned shops and a central fountain. This is the first playable town foundation.</p>';}infoModal.classList.remove('hidden');}
  canvas.addEventListener('click',e=>{const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*canvas.width/r.width,y=(e.clientY-r.top)*canvas.height/r.height;const hit=shops.map(s=>({s,d:Math.hypot(s.hit.x-x,s.hit.y-y)})).filter(o=>o.d<48).sort((a,b)=>a.d-b.d)[0];if(hit)openShop(hit.s);});
  window.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();keys.add(e.key);if(e.key===' '||e.key==='Enter')interact();});
  window.addEventListener('keyup',e=>keys.delete(e.key));window.addEventListener('blur',()=>keys.clear());
  document.getElementById('action-button').addEventListener('click',interact);
  document.getElementById('map-button').addEventListener('click',()=>showInfo(true));
  document.getElementById('help-button').addEventListener('click',()=>showInfo(false));
  document.getElementById('modal-close').addEventListener('click',()=>modal.classList.add('hidden'));
  document.getElementById('modal-back').addEventListener('click',()=>modal.classList.add('hidden'));
  document.getElementById('shop-action').addEventListener('click',()=>{if(!selectedShop||!selectedShop.open)return;modal.classList.add('hidden');showToast('Welcome to '+selectedShop.name+'! Shop gameplay is coming next.');});
  document.getElementById('info-close').addEventListener('click',()=>infoModal.classList.add('hidden'));
  document.getElementById('info-done').addEventListener('click',()=>infoModal.classList.add('hidden'));
  document.getElementById('info-backdrop').addEventListener('click',e=>{if(e.target===infoModal)infoModal.classList.add('hidden');});
  document.getElementById('modal-backdrop').addEventListener('click',e=>{if(e.target===modal)modal.classList.add('hidden');});
  // Touch joystick
  const joy=document.getElementById('joystick'),stick=document.getElementById('stick');let joyId=null;
  joy.addEventListener('pointerdown',e=>{joyId=e.pointerId;joy.setPointerCapture(joyId);joyMove(e);});
  joy.addEventListener('pointermove',e=>{if(e.pointerId===joyId)joyMove(e);});
  function joyMove(e){const r=joy.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=e.clientX-cx,dy=e.clientY-cy;const len=Math.hypot(dx,dy),max=25;if(len>max){dx=dx/len*max;dy=dy/len*max;}stick.style.transform='translate('+dx+'px,'+dy+'px)';keys.delete('ArrowLeft');keys.delete('ArrowRight');keys.delete('ArrowUp');keys.delete('ArrowDown');if(Math.abs(dx)>7)keys.add(dx<0?'ArrowLeft':'ArrowRight');if(Math.abs(dy)>7)keys.add(dy<0?'ArrowUp':'ArrowDown');}
  function resetJoy(){joyId=null;stick.style.transform='';['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].forEach(k=>keys.delete(k));}
  joy.addEventListener('pointerup',resetJoy);joy.addEventListener('pointercancel',resetJoy);joy.addEventListener('lostpointercapture',resetJoy);
  drawScene();requestAnimationFrame(loop);
})();