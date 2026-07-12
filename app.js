
const target=4000;
let state={player:0,ai:0,turn:0,whose:"player",dice:[],available:6,selected:new Set(),rolled:false,sound:true,over:false,aiTurn:0};
const $=id=>document.getElementById(id);
const diceEl=$("dice"),statusEl=$("status"),rollBtn=$("rollBtn"),bankBtn=$("bankBtn");
const positions=[
  {x:20,y:30,r:-14},{x:45,y:20,r:13},{x:70,y:36,r:-8},
  {x:33,y:58,r:9},{x:62,y:69,r:-16},{x:49,y:44,r:5}
];
const pipMap={
  1:[[50,50]],2:[[30,30],[70,70]],3:[[28,28],[50,50],[72,72]],
  4:[[28,28],[72,28],[28,72],[72,72]],5:[[28,28],[72,28],[50,50],[28,72],[72,72]],
  6:[[28,23],[72,23],[28,50],[72,50],[28,77],[72,77]]
};
function dieHTML(v){return pipMap[v].map(([x,y])=>`<i class="pip" style="left:${x}%;top:${y}%;transform:translate(-50%,-50%)"></i>`).join("")}
function save(){try{localStorage.setItem("kostiPremiumSave",JSON.stringify({...state,selected:[...state.selected]}))}catch(e){}}
function load(){try{const s=JSON.parse(localStorage.getItem("kostiPremiumSave"));if(s&&!s.over)state={...state,...s,selected:new Set(s.selected||[])}}catch(e){}}
function beep(freq=160,d=.06){if(!state.sound)return;try{const c=new(window.AudioContext||window.webkitAudioContext)(),o=c.createOscillator(),g=c.createGain();o.frequency.value=freq;o.type="triangle";g.gain.setValueAtTime(.045,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+d);o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+d)}catch(e){}}
function randomDie(){return 1+Math.floor(Math.random()*6)}
function scoreDice(vals){
  if(!vals.length)return 0;
  const key=[...vals].sort((a,b)=>a-b).join("");
  if(key==="123456")return 1500;if(key==="12345")return 500;if(key==="23456")return 750;
  const c=[0,0,0,0,0,0,0];vals.forEach(v=>c[v]++);
  let score=0;
  for(let v=1;v<=6;v++){const n=c[v];if(n>=3){score+=(v===1?1000:v*100)*Math.pow(2,n-3);c[v]=0}}
  return score+c[1]*100+c[5]*50;
}
function hasAnyScore(vals){
  if(vals.includes(1)||vals.includes(5))return true;
  const c={};vals.forEach(v=>c[v]=(c[v]||0)+1);
  if(Object.values(c).some(n=>n>=3))return true;
  const k=[...vals].sort((a,b)=>a-b).join("");
  return k.includes("12345")||k.includes("23456")||k.includes("123456");
}
function selectedValues(){return [...state.selected].map(i=>state.dice[i])}
function render(){
  $("playerScore").textContent=state.player;$("aiScore").textContent=state.ai;
  $("turnScore").textContent=state.whose==="player"?state.turn:0;
  $("selectedScore").textContent=state.whose==="player"?scoreDice(selectedValues()):0;
  $("aiTurnScore").textContent=state.whose==="ai"?state.aiTurn:0;
  $("aiSelectedScore").textContent=state.whose==="ai"?scoreDice(selectedValues()):0;
  $("playerCard").classList.toggle("active",state.whose==="player");
  $("aiCard").classList.toggle("active",state.whose==="ai");
  diceEl.innerHTML="";
  state.dice.forEach((v,i)=>{
    const p=positions[i]||positions[0],d=document.createElement("button");
    d.className="die";d.style.left=p.x+"%";d.style.top=p.y+"%";d.style.setProperty("--r",p.r+"deg");d.innerHTML=dieHTML(v);
    if(state.selected.has(i))d.classList.add("selected");
    if(state.whose!=="player"||!state.rolled)d.classList.add("locked");
    d.addEventListener("click",()=>toggleDie(i));diceEl.appendChild(d);
  });
  const s=scoreDice(selectedValues());
  rollBtn.disabled=state.over||state.whose!=="player"||(state.rolled&&s===0);
  bankBtn.disabled=state.over||state.whose!=="player"||!state.rolled||s===0;
  rollBtn.textContent=state.rolled?"РИСКНУТЬ":"БРОСИТЬ";
  save();
}
function toggleDie(i){state.selected.has(i)?state.selected.delete(i):state.selected.add(i);const s=scoreDice(selectedValues());statusEl.textContent=s?`Отобрано: ${s} очков`:"Эта комбинация очков не даёт";beep(250,.035);render()}
function animateDice(){[...diceEl.children].forEach(d=>d.classList.add("rolling"));setTimeout(()=>[...diceEl.children].forEach(d=>d.classList.remove("rolling")),470)}
function playerRoll(){
  if(state.rolled){const s=scoreDice(selectedValues());if(!s)return;state.turn+=s;state.available-=state.selected.size;if(state.available<=0){state.available=6;statusEl.textContent="Горячие кости! Бросайте все шесть."}}
  state.dice=Array.from({length:state.available},randomDie);state.selected.clear();state.rolled=true;beep(120,.1);render();animateDice();
  if(!hasAnyScore(state.dice)){state.turn=0;state.rolled=false;statusEl.textContent="Неудачный бросок. Очки раунда сгорели.";render();setTimeout(startAI,1000)}
  else statusEl.textContent="Выберите кости с очками.";
}
function bank(){
  const s=scoreDice(selectedValues());if(!s)return;state.turn+=s;state.player+=state.turn;beep(420,.12);
  state.turn=0;state.rolled=false;state.available=6;state.dice=[];state.selected.clear();
  if(checkWin("player"))return;statusEl.textContent="Очки записаны. Ход соперника.";render();setTimeout(startAI,700)
}
function checkWin(who){if(state[who]>=target){state.over=true;statusEl.textContent=who==="player"?"Вы выиграли партию!":"Соперник победил.";render();return true}return false}
function bestSelection(vals){let best={score:0,idx:[]};for(let m=1;m<(1<<vals.length);m++){const idx=[],arr=[];for(let i=0;i<vals.length;i++)if(m>>i&1){idx.push(i);arr.push(vals[i])}const s=scoreDice(arr);if(s>best.score||(s===best.score&&idx.length<best.idx.length))best={score:s,idx}}return best}
function startAI(){if(state.over)return;state.whose="ai";state.aiTurn=0;state.available=6;state.dice=[];state.selected.clear();state.rolled=false;render();aiRoll()}
function aiRoll(){
  state.dice=Array.from({length:state.available},randomDie);state.selected.clear();state.rolled=true;statusEl.textContent="Соперник бросает кости…";beep(105,.1);render();animateDice();
  setTimeout(()=>{const best=bestSelection(state.dice);if(!best.score){state.aiTurn=0;statusEl.textContent="Сопернику не повезло. Очки сгорели.";render();setTimeout(endAI,900);return}
    best.idx.forEach(i=>state.selected.add(i));state.aiTurn+=best.score;state.available-=best.idx.length;if(state.available<=0)state.available=6;render();
    const need=target-state.ai,threshold=state.available<=2?650:900,bankNow=state.aiTurn>=need||state.aiTurn>=threshold||(state.aiTurn>=550&&Math.random()<.55);
    if(bankNow){state.ai+=state.aiTurn;statusEl.textContent=`Соперник забирает ${state.aiTurn} очков.`;state.aiTurn=0;render();if(checkWin("ai"))return;setTimeout(endAI,900)}
    else{statusEl.textContent=`Соперник рискует. Раунд: ${state.aiTurn}.`;render();setTimeout(aiRoll,950)}
  },650)
}
function endAI(){state.whose="player";state.turn=0;state.aiTurn=0;state.available=6;state.dice=[];state.selected.clear();state.rolled=false;statusEl.textContent="Ваш ход. Бросьте кости.";render()}
function newGame(){state={player:0,ai:0,turn:0,whose:"player",dice:[],available:6,selected:new Set(),rolled:false,sound:state.sound,over:false,aiTurn:0};try{localStorage.removeItem("kostiPremiumSave")}catch(e){}statusEl.textContent="Ваш ход. Бросьте кости.";render()}
rollBtn.addEventListener("click",playerRoll);bankBtn.addEventListener("click",bank);
$("rulesBtn").addEventListener("click",()=>$("rulesDialog").showModal());
$("closeRules").addEventListener("click",()=>$("rulesDialog").close());
$("newBtn").addEventListener("click",()=>{if(confirm("Начать новую игру?"))newGame()});
$("soundBtn").addEventListener("click",()=>{state.sound=!state.sound;$("soundBtn").textContent=state.sound?"♫":"×";render()});
load();$("soundBtn").textContent=state.sound?"♫":"×";render();
if("serviceWorker"in navigator)navigator.serviceWorker.register("./sw.js").catch(()=>{});
