'use strict';
const $=id=>document.getElementById(id);
const num=id=>{const n=Number($(id).value);return Number.isFinite(n)?n:0};
const money=n=>`₹${Number(n).toFixed(2)}`;
const ord=n=>n%100>=11&&n%100<=13?'th':({1:'st',2:'nd',3:'rd'}[n%10]||'th');

function calculateNetwork(){
 const price=num('productPrice'), refs=Math.floor(num('referralsPerUser')), lines=Math.floor(num('totalLines'));
 if(price<=0||refs<1||lines<1){alert('Please enter valid network settings.');return}
 const rewards=Array.from({length:7},(_,i)=>num(`reward${i+1}`));
 let users=1,total=0,rows=[];
 for(let line=1;line<=lines;line++){
   users*=refs; total+=users;
   rows.push({line,users,reward:line<=7?rewards[line-1]:0});
 }
 $('totalUsers').textContent=total.toLocaleString('en-IN');
 $('initialPurchases').textContent=total.toLocaleString('en-IN');
 $('originalRewards').textContent='Pending';
 $('rewardPurchases').textContent='Pending';
 $('networkTable').innerHTML=rows.map(r=>`<tr><td>${r.line}${ord(r.line)} Line</td><td>${r.users.toLocaleString('en-IN')}</td><td>${money(r.reward)}</td></tr>`).join('');
 $('calculationNotes').innerHTML=`<div>Product price: <strong>${money(price)}</strong></div>
<div>Direct referrals per user: <strong>${refs}</strong></div>
<div>Calculation lines: <strong>${lines}</strong></div>
<div>Rewards are configurable for up to 7 levels.</div>
<div>The exact repeat-purchase simulation will be added after the business rules are finalized.</div>`;
 $('results').classList.remove('hidden');
}
$('calculateBtn').addEventListener('click',calculateNetwork);
